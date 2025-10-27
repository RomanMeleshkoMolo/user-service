const {
  RekognitionClient,
  DetectModerationLabelsCommand,
  DetectFacesCommand,
} = require('@aws-sdk/client-rekognition');
const {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const User = require('../models/userModel');
const sharp = require('sharp');
const { Readable } = require('stream');
const { randomUUID } = require('crypto');
const path = require('path');

const AWS_REGION = process.env.AWS_REGION;
const AWS_REKOGNITION_REGION = process.env.AWS_REKOGNITION_REGION;
const S3_BUCKET = process.env.S3_BUCKET;
const ENABLE_DEBUG = process.env.VALIDATION_DEBUG === '1';
const PUBLIC_CDN_URL = process.env.PUBLIC_CDN_URL || ''; // например, https://cdn.example.com
const MAKE_PUBLIC = process.env.MAKE_PUBLIC === '1'; // если нужно ставить ACL: public-read

// Пороги
const MODERATION_THRESHOLD = Number(process.env.MODERATION_THRESHOLD || 80);
const FACE_CONFIDENCE_MIN = Number(process.env.FACE_CONFIDENCE_MIN || 70);
const FACE_MIN_RELATIVE_SIZE = Number(process.env.FACE_MIN_RELATIVE_SIZE || 0.08);
const MAX_ABS_YAW = Number(process.env.FACE_MAX_ABS_YAW || 25);
const MAX_ABS_PITCH = Number(process.env.FACE_MAX_ABS_PITCH || 25);
const MAX_ABS_ROLL = Number(process.env.FACE_MAX_ABS_ROLL || 25);
const MIN_SHARPNESS = Number(process.env.FACE_MIN_SHARPNESS || 40);
const MIN_BRIGHTNESS = Number(process.env.FACE_MIN_BRIGHTNESS || 15);
const MAX_BRIGHTNESS = Number(process.env.FACE_MAX_BRIGHTNESS || 95);
const FACE_MIN_COUNT = Number(process.env.FACE_MIN_COUNT || 1);
const FACE_MAX_COUNT = Number(process.env.FACE_MAX_COUNT || 10);

// Максимальные размеры для сохранения (по желанию)
const MAX_WIDTH = Number(process.env.IMG_MAX_WIDTH || 2000);
const MAX_HEIGHT = Number(process.env.IMG_MAX_HEIGHT || 2000);
const WEBP_QUALITY = Number(process.env.WEBP_QUALITY || 90);

const BLOCKED_CATEGORIES = new Set([
  'Violence','Graphic Violence','Weapons','Hate Symbols',
  'Explicit Nudity','Sexual Activity','Sexual Content',
  'Visually Disturbing','Self-Harm','Drugs','Alcohol','Tobacco',
]);

const rekognition = new RekognitionClient({ region: AWS_REKOGNITION_REGION });
const s3 = new S3Client({ region: AWS_REGION });

function buildDebug(obj) {
  return ENABLE_DEBUG ? obj : undefined;
}

async function bodyToBuffer(body) {
  if (body instanceof Readable) {
    return await new Promise((resolve, reject) => {
      const chunks = [];
      body.on('data', (chunk) => chunks.push(chunk));
      body.on('end', () => resolve(Buffer.concat(chunks)));
      body.on('error', reject);
    });
  }
  if (typeof body?.transformToByteArray === 'function') {
    const arr = await body.transformToByteArray();
    return Buffer.from(arr);
  }
  if (body instanceof Uint8Array) return Buffer.from(body);
  throw new Error('Unsupported GetObject Body type');
}

async function getObjectBytes(Bucket, Key) {
  const out = await s3.send(new GetObjectCommand({ Bucket, Key }));
  return await bodyToBuffer(out.Body);
}

function userKeyPrefix(userId) {
  return `tmp/${String(userId)}/`;
}

// ВОЗМОЖНЫЕ СТРАТЕГИИ:
// - mode: 'append-timestamp'  -> name_1699999999999.webp (не перезаписывает)
// - mode: 'keep-name'         -> name.webp (может перезаписать одноимённый файл)
// - mode: 'fixed-current'     -> current.webp (всегда один файл на пользователя)

function buildApprovedKey(userId, srcKey, mode = 'append-timestamp') {
  const base = path.posix.basename(srcKey); // только имя файла, без папок
  const nameSansExt = base.replace(/\.[^.]+$/, '');
  const safeUserId = String(userId);

  if (mode === 'fixed-current') {
    return `approved/${safeUserId}/current.webp`;
  }
  if (mode === 'keep-name') {
    return `approved/${safeUserId}/${nameSansExt}.webp`;
  }

  // По умолчанию — уникальное имя в папке пользователя
  const stamp = Date.now();
  return `approved/${safeUserId}/${nameSansExt}_${stamp}.webp`;
}

function buildRejectedKey(userId, srcKey, mode = 'append-timestamp') {
  const base = path.posix.basename(srcKey);
  const nameSansExt = base.replace(/\.[^.]+$/, '');
  const ext = (base.includes('.') ? base.slice(base.lastIndexOf('.')) : '.bin').toLowerCase();
  const safeUserId = String(userId);

  if (mode === 'fixed-current') {
    return `rejected/${safeUserId}/current${ext}`;
  }
  if (mode === 'keep-name') {
    return `rejected/${safeUserId}/${nameSansExt}${ext}`;
  }

  const stamp = Date.now();
  return `rejected/${safeUserId}/${nameSansExt}_${stamp}${ext}`;
}

async function moveObject(Bucket, srcKey, destKey) {
  const CopySource = `/${Bucket}/${encodeURIComponent(srcKey).replace(/%2F/g, '/')}`;

  // копируем
  await s3.send(new CopyObjectCommand({
    Bucket,
    CopySource,
    Key: destKey,
    MetadataDirective: 'COPY', // сохраняем метаданные
  }));

  // удаляем исходник
  await s3.send(new DeleteObjectCommand({ Bucket, Key: srcKey }));

  return destKey;
}

// На всякий случай убираем ведущий слэш
function sanitizeKey(k) {
  if (typeof k !== 'string') return k;
  return k.startsWith('/') ? k.slice(1) : k;
}

exports.validateUserPhoto = async (req, res) => {
  try {
    // Диагностика конфигурации
    const s3Region = await s3.config.region();
    const rekRegion = await rekognition.config.region();

    console.log('Validation env:', {
      AWS_REGION, AWS_REKOGNITION_REGION, S3_BUCKET, s3Region, rekRegion
    });

    const userId = req.user?._id || req.user?.id || req.auth?.userId || req.regUserId || req.userId;
    let { key } = req.body || {};

    if (!userId) return res.status(401).json({ ok: false, reason: 'Unauthorized' });

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ ok: false, reason: 'key is required' });
    }
    key = sanitizeKey(key);

    if (!S3_BUCKET || !AWS_REGION || !AWS_REKOGNITION_REGION) {
      console.error('Validation misconfigured:', { S3_BUCKET, AWS_REGION, AWS_REKOGNITION_REGION });
      return res.status(500).json({ ok: false, reason: 'Server is misconfigured' });
    }

    // Префикс и валидируемый путь
    const prefix = userKeyPrefix(userId);
    console.log('validate key check', {
      userId: String(userId), key, expectedPrefix: prefix
    });

    if (!key.startsWith(prefix) || key.includes('..')) {
      return res.status(400).json({ ok: false, reason: 'invalid key for user' });
    }

    // Проверим существование
    try {
      await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    } catch (e) {
      const code = e?.$metadata?.httpStatusCode || e?.code;
      console.warn('HeadObject error', { Bucket: S3_BUCKET, Key: key, code, name: e?.name, message: e?.message });
      if ((code || 404) === 404) {
        return res.status(400).json({ ok: false, reason: 'Object not found in S3' });
      }
      return res.status(403).json({ ok: false, reason: 'Access denied to S3 object' });
    }

    // Считаем байты
    let bytes;
    try {
      bytes = await getObjectBytes(S3_BUCKET, key);
    } catch (e) {
      console.error('GetObject for sharp failed:', { message: e?.message });
      return res.status(422).json({ ok: false, reason: 'Не удалось прочитать изображение' });
    }

    // Локальная валидация изображений
    let width = 0, height = 0, metaFormat = '';
    try {
      const img = sharp(bytes, { failOn: 'error' });
      const meta = await img.metadata();
      width = meta.width || 0;
      height = meta.height || 0;
      metaFormat = (meta.format || '').toLowerCase();

      const pixels = width * height;
      if (!width || !height) {
        return res.status(422).json({ ok: false, reason: 'Не удалось прочитать изображение' });
      }
      if (pixels > 36_000_000) {
        return res.status(422).json({ ok: false, reason: 'Слишком большое изображение' });
      }

      const allowedFormats = new Set(['jpeg','jpg','png','webp','heic','heif']);
      if (!allowedFormats.has(metaFormat)) {
        return res.status(422).json({ ok: false, reason: 'Неподдерживаемый формат' });
      }
    } catch (e) {
      console.error('sharp metadata error:', { message: e?.message });
      return res.status(422).json({ ok: false, reason: 'Не удалось прочитать изображение' });
    }

    // Rekognition по S3Object
    const Image = { S3Object: { Bucket: S3_BUCKET, Name: key } };

    // Модерация
    let modResp;
    try {
      modResp = await rekognition.send(new DetectModerationLabelsCommand({
        Image,
        MinConfidence: MODERATION_THRESHOLD,
      }));
    } catch (e) {
      console.error('DetectModerationLabels error:', {
        name: e?.name, message: e?.message, code: e?.Code || e?.code, meta: e?.$metadata
      });
      return res.status(500).json({ ok: false, reason: 'Internal server error' });
    }

    const labels = Array.isArray(modResp?.ModerationLabels) ? modResp.ModerationLabels : [];
    const blocked = labels.filter(l => {
      const conf = l.Confidence || 0;
      const name = l.Name || '';
      const parent = l.ParentName || '';
      return conf >= MODERATION_THRESHOLD && (BLOCKED_CATEGORIES.has(name) || BLOCKED_CATEGORIES.has(parent));
    });

    if (blocked.length > 0) {

      const rejectedKey = buildRejectedKey(userId, key, 'append-timestamp');
      try {
        await moveObject(S3_BUCKET, key, rejectedKey);
      } catch (e) {
        console.error('Failed to move rejected image:', { message: e?.message });
        // Если перенос не удался — в крайнем случае не удаляем оригинал,
        // чтобы не потерять файл. Можно записать originalKey отдельно.
      }

      await User.updateOne(
        { _id: userId },
        { $push: { userPhoto: {
          key: rejectedKey,               // сохраняем путь из "rejected"
          originalKey: key,               // опционально — исходный tmp-путь
          bucket: S3_BUCKET,
          status: 'rejected',
          reason: 'moderation',
          moderation: labels,
          createdAt: new Date()
        } } }
      );

      return res.status(422).json({
        ok: false,
        reason: 'Запрещенный контент',
        labels: blocked.map(l => ({ name: l.Name, confidence: l.Confidence })),
        debug: buildDebug({ rawLabels: labels }),
      });
    }

    // Лица
    let facesResp;
    try {
      facesResp = await rekognition.send(new DetectFacesCommand({
        Image,
        Attributes: ['ALL'],
      }));
    } catch (e) {
      console.error('DetectFaces error:', {
        name: e?.name, message: e?.message, code: e?.Code || e?.code, meta: e?.$metadata
      });
      return res.status(500).json({ ok: false, reason: 'Internal server error' });
    }

    const faces = Array.isArray(facesResp?.FaceDetails) ? facesResp.FaceDetails : [];

    if (faces.length < FACE_MIN_COUNT || faces.length > FACE_MAX_COUNT) {

      const rejectedKey = buildRejectedKey(userId, key, 'append-timestamp');
      try {
        await moveObject(S3_BUCKET, key, rejectedKey);
      } catch (e) {
        console.error('Failed to move rejected image:', { message: e?.message });
        // Если перенос не удался — в крайнем случае не удаляем оригинал,
        // чтобы не потерять файл. Можно записать originalKey отдельно.
      }

      await User.updateOne(
        { _id: userId },
        { $push: { userPhoto: {
          key: rejectedKey,
          originalKey: key,
          bucket: S3_BUCKET,
          status: 'rejected',
          reason: 'face_count',
          faceCount: faces.length,
          createdAt: new Date()
        } } }
      );

      return res.status(422).json({
        ok: false,
        reason: `На фото должно быть от ${FACE_MIN_COUNT} до ${FACE_MAX_COUNT} человек`,
        debug: buildDebug({ count: faces.length }),
      });
    }

    // Проверяем, есть ли хотя бы одно "проходящее" лицо
    const passes = faces.some(face => {
      const conf = face.Confidence || 0;
      const pose = face.Pose || {};
      const quality = face.Quality || {};
      const box = face.BoundingBox || {};

      const yaw = Math.abs(pose.Yaw ?? 0);
      const pitch = Math.abs(pose.Pitch ?? 0);
      const roll = Math.abs(pose.Roll ?? 0);

      const brightness = quality.Brightness ?? 0;
      const sharpness = quality.Sharpness ?? 0;

      // BoundingBox относительный: Width/Height в [0..1]
      const relArea = (box.Width || 0) * (box.Height || 0);

      return (
        conf >= FACE_CONFIDENCE_MIN &&
        relArea >= FACE_MIN_RELATIVE_SIZE &&
        yaw <= MAX_ABS_YAW &&
        pitch <= MAX_ABS_PITCH &&
        roll <= MAX_ABS_ROLL &&
        sharpness >= MIN_SHARPNESS &&
        brightness >= MIN_BRIGHTNESS &&
        brightness <= MAX_BRIGHTNESS
      );
    });

    if (!passes) {

      const rejectedKey = buildRejectedKey(userId, key, 'append-timestamp');
      try {
        await moveObject(S3_BUCKET, key, rejectedKey);
      } catch (e) {
        console.error('Failed to move rejected image:', { message: e?.message });
      }

      await User.updateOne(
        { _id: userId },
        { $push: { userPhoto: {
          key: rejectedKey,
          originalKey: key,
          bucket: S3_BUCKET,
          status: 'rejected',
          reason: 'face_quality',
          faces,
          createdAt: new Date()
        } } }
      );

      return res.status(422).json({
        ok: false,
        reason: 'Качество лица недостаточно (ракурс/резкость/яркость/размер)',
        debug: buildDebug({ faces }),
      });
    }

    // Фото проходит. Готовим финальный ключ и конвертацию в WEBP
    // const approvedKey = approvedKeyFromTmp(key);
    const approvedKey = buildApprovedKey(userId, key, 'append-timestamp'); // или 'keep-name' / 'fixed-current'

    // Конвертация и ограничение размера
    let webpBuffer, finalMeta;
    try {
      const pipeline = sharp(bytes).rotate(); // auto-rotate по EXIF
      // Ограничим размеры, сохраняя пропорции
      pipeline.resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: 'inside', withoutEnlargement: true });
      pipeline.webp({ quality: WEBP_QUALITY });
      webpBuffer = await pipeline.toBuffer();
      const m = await sharp(webpBuffer).metadata();
      finalMeta = { width: m.width || 0, height: m.height || 0, format: 'webp' };
    } catch (e) {
      console.error('sharp to webp error:', { message: e?.message });
      return res.status(500).json({ ok: false, reason: 'Image processing failed' });
    }

    // Загрузка финального файла в S3
    try {
      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: approvedKey,
        Body: webpBuffer,
        ContentType: 'image/webp',
        ...(MAKE_PUBLIC ? { ACL: 'public-read' } : {}),
      }));
    } catch (e) {
      console.error('PutObject approved error:', { message: e?.message });
      return res.status(500).json({ ok: false, reason: 'Upload to S3 failed' });
    }

    // Удаляем временный объект
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    } catch (e) {
      console.warn('Delete tmp failed (non-critical):', { message: e?.message });
    }

    // Формируем публичный URL, если есть CDN
    const url = PUBLIC_CDN_URL
      ? `${PUBLIC_CDN_URL.replace(/\/+$/, '')}/${approvedKey}`
      : `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${approvedKey}`;

    // Сохраняем запись в БД в массив userPhoto
    const photoDoc = {
      key: approvedKey,
      bucket: S3_BUCKET,
      url,
      status: 'approved',
      width: finalMeta.width,
      height: finalMeta.height,
      format: 'webp',
      createdAt: new Date(),
    };

    await User.updateOne(
      { _id: userId },
      { $push: { userPhoto: photoDoc } }
    );

    return res.json({
      ok: true,
      photo: photoDoc,
      debug: buildDebug({ facesCount: faces.length, modLabels: labels })
    });
  } catch (e) {
    console.error('validateUserPhoto fatal:', e);
    return res.status(500).json({ ok: false, reason: 'Internal server error' });
  }
};
