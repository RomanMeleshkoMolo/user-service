// const {
//   RekognitionClient,
//   DetectModerationLabelsCommand,
//   DetectFacesCommand,
// } = require('@aws-sdk/client-rekognition');
// const {
//   S3Client,
//   GetObjectCommand,
//   DeleteObjectCommand,
//   HeadObjectCommand,
// } = require('@aws-sdk/client-s3');
// const { Readable } = require('stream');
//
// const AWS_REGION = process.env.AWS_REGION;                 // регион S3 (eu-north-1)
// const AWS_REKOGNITION_REGION = process.env.AWS_REKOGNITION_REGION; // регион Rekognition (например, eu-central-1)
// const S3_BUCKET = process.env.S3_BUCKET;                   // uploads-photo
// const ENABLE_DEBUG = process.env.VALIDATION_DEBUG === '1';
//
// console.log('AWS_REGION=', AWS_REGION);
// console.log('AWS_REKOGNITION_REGION=', AWS_REKOGNITION_REGION);
//
// // БОЛЕЕ МЯГКИЕ ДЕФОЛТЫ
// const MODERATION_THRESHOLD = Number(process.env.MODERATION_THRESHOLD || 80);
// const FACE_CONFIDENCE_MIN = Number(process.env.FACE_CONFIDENCE_MIN || 70); // было 95
// const FACE_MIN_RELATIVE_SIZE = Number(process.env.FACE_MIN_RELATIVE_SIZE || 0.08); // было 0.15
//
// // Доп. пороги качества
// const MAX_ABS_YAW = Number(process.env.FACE_MAX_ABS_YAW || 25);
// const MAX_ABS_PITCH = Number(process.env.FACE_MAX_ABS_PITCH || 25);
// const MAX_ABS_ROLL = Number(process.env.FACE_MAX_ABS_ROLL || 25);
// const MIN_SHARPNESS = Number(process.env.FACE_MIN_SHARPNESS || 40); // 0..100
// const MIN_BRIGHTNESS = Number(process.env.FACE_MIN_BRIGHTNESS || 15);
// const MAX_BRIGHTNESS = Number(process.env.FACE_MAX_BRIGHTNESS || 95);
//
// const BLOCKED_CATEGORIES = new Set([
//   'Violence','Graphic Violence','Weapons','Hate Symbols',
//   'Explicit Nudity','Sexual Activity','Sexual Content',
//   'Visually Disturbing','Self-Harm','Drugs','Alcohol','Tobacco',
// ]);
//
// const rekognition = new RekognitionClient({ region: AWS_REKOGNITION_REGION });
// const s3 = new S3Client({ region: AWS_REGION });
//
// // Универсально превращаем Body в Buffer (поддержка Readable, Blob, Uint8Array)
// async function bodyToBuffer(body) {
//   if (body instanceof Readable) {
//     return await new Promise((resolve, reject) => {
//       const chunks = [];
//       body.on('data', (chunk) => chunks.push(chunk));
//       body.on('end', () => resolve(Buffer.concat(chunks)));
//       body.on('error', reject);
//     });
//   }
//   if (typeof body?.transformToByteArray === 'function') {
//     const arr = await body.transformToByteArray();
//     return Buffer.from(arr);
//   }
//   if (body instanceof Uint8Array) {
//     return Buffer.from(body);
//   }
//   throw new Error('Unsupported GetObject Body type');
// }
//
// async function getObjectBytes(Bucket, Key) {
//   const out = await s3.send(new GetObjectCommand({ Bucket, Key }));
//   return await bodyToBuffer(out.Body);
// }
//
// async function deleteS3Object(Key) {
//   try {
//     await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key }));
//   } catch (err) {
//     console.error('Delete S3 object error:', err);
//   }
// }
//
// function buildDebug(obj) {
//   return ENABLE_DEBUG ? obj : undefined;
// }
//
// async function validateUserPhoto(req, res) {
//   console.log('validateUserPhoto hit');
//
//   try {
//     const { key } = req.body || {};
//     if (!key || typeof key !== 'string') {
//       return res.status(400).json({ ok: false, reason: 'key is required' });
//     }
//     if (!S3_BUCKET || !AWS_REGION || !AWS_REKOGNITION_REGION) {
//       return res.status(500).json({ ok: false, reason: 'Server is misconfigured (regions/bucket)' });
//     }
//
//     // Проверим, что объект существует
//     try {
//       await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
//     } catch {
//       return res.status(400).json({ ok: false, reason: 'Object not found in S3' });
//     }
//
//     // Считываем байты из S3
//     const imageBytes = await getObjectBytes(S3_BUCKET, key);
//
//     // Модерация
//     const modResp = await rekognition.send(new DetectModerationLabelsCommand({
//       Image: { Bytes: imageBytes },
//       MinConfidence: MODERATION_THRESHOLD,
//     }));
//
//     const labels = Array.isArray(modResp.ModerationLabels) ? modResp.ModerationLabels : [];
//     const blocked = labels.filter(l => {
//       const conf = l.Confidence || 0;
//       const name = l.Name || '';
//       const parent = l.ParentName || '';
//       return conf >= MODERATION_THRESHOLD && (BLOCKED_CATEGORIES.has(name) || BLOCKED_CATEGORIES.has(parent));
//     });
//
//     if (blocked.length > 0) {
//       await deleteS3Object(key);
//       return res.status(422).json({
//         ok: false,
//         reason: 'Запрещенный контент на фото',
//         labels: blocked.map(l => ({ name: l.Name, confidence: l.Confidence })),
//         debug: buildDebug({ rawLabels: labels }),
//       });
//     }
//
//     // Распознавание лиц (просим расширенные атрибуты для диагностики/качества)
//     const facesResp = await rekognition.send(new DetectFacesCommand({
//       Image: { Bytes: imageBytes },
//       Attributes: ['ALL'],
//     }));
//
//     const faces = Array.isArray(facesResp.FaceDetails) ? facesResp.FaceDetails : [];
//     if (faces.length !== 1) {
//       await deleteS3Object(key);
//       return res.status(422).json({
//         ok: false,
//         reason: 'На фото должен быть ровно один человек',
//         debug: buildDebug({ count: faces.length }),
//       });
//     }
//
//     // Выбираем самое уверенное лицо (на случай артефактов)
//     faces.sort((a, b) => (b.Confidence || 0) - (a.Confidence || 0));
//     // const face = faces;
//     const face = faces[0];
//
//     const conf = face.Confidence || 0;
//     const pose = face.Pose || {};
//     const quality = face.Quality || {};
//     const box = face.BoundingBox || {};
//
//     const yaw = Math.abs(pose.Yaw ?? 0);
//     const pitch = Math.abs(pose.Pitch ?? 0);
//     const roll = Math.abs(pose.Roll ?? 0);
//     const sharpness = quality.Sharpness ?? 100;   // если нет поля — считаем хорошей
//     const brightness = quality.Brightness ?? 50; // среднее по умолчанию
//     const minSide = Math.min(box.Width || 0, box.Height || 0);
//
//     // Мягкие правила прохождения
//     const pass =
//       conf >= FACE_CONFIDENCE_MIN &&
//       minSide >= FACE_MIN_RELATIVE_SIZE &&
//       yaw <= MAX_ABS_YAW &&
//       pitch <= MAX_ABS_PITCH &&
//       roll <= MAX_ABS_ROLL &&
//       sharpness >= MIN_SHARPNESS &&
//       brightness >= MIN_BRIGHTNESS &&
//       brightness <= MAX_BRIGHTNESS;
//
//     if (!pass) {
//       await deleteS3Object(key);
//       return res.status(422).json({
//         ok: false,
//         reason: 'Низкое качество распознавания лица или условия съемки',
//         debug: buildDebug({
//           confidence: conf,
//           minSide,
//           pose: { yaw, pitch, roll },
//           quality: { sharpness, brightness },
//           thresholds: {
//             FACE_CONFIDENCE_MIN,
//             FACE_MIN_RELATIVE_SIZE,
//             MAX_ABS_YAW,
//             MAX_ABS_PITCH,
//             MAX_ABS_ROLL,
//             MIN_SHARPNESS,
//             MIN_BRIGHTNESS,
//             MAX_BRIGHTNESS,
//           }
//         })
//       });
//     }
//
//     return res.json({ ok: true });
//   } catch (err) {
//     console.error('validateUserPhoto error:', err);
//     return res.status(500).json({ ok: false, reason: 'Internal validation error' });
//   }
// }
//
// module.exports = { validateUserPhoto };
//






const {
  RekognitionClient,
  DetectModerationLabelsCommand,
  DetectFacesCommand,
} = require('@aws-sdk/client-rekognition');
const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { Readable } = require('stream');

const AWS_REGION = process.env.AWS_REGION;                 // регион S3 (eu-north-1)
const AWS_REKOGNITION_REGION = process.env.AWS_REKOGNITION_REGION; // регион Rekognition (например, eu-central-1)
const S3_BUCKET = process.env.S3_BUCKET;                   // uploads-photo
const ENABLE_DEBUG = process.env.VALIDATION_DEBUG === '1';

console.log('AWS_REGION=', AWS_REGION);
console.log('AWS_REKOGNITION_REGION=', AWS_REKOGNITION_REGION);

// БОЛЕЕ МЯГКИЕ ДЕФОЛТЫ
const MODERATION_THRESHOLD = Number(process.env.MODERATION_THRESHOLD || 80);
const FACE_CONFIDENCE_MIN = Number(process.env.FACE_CONFIDENCE_MIN || 70); // было 95
const FACE_MIN_RELATIVE_SIZE = Number(process.env.FACE_MIN_RELATIVE_SIZE || 0.08); // было 0.15

// Доп. пороги качества
const MAX_ABS_YAW = Number(process.env.FACE_MAX_ABS_YAW || 25);
const MAX_ABS_PITCH = Number(process.env.FACE_MAX_ABS_PITCH || 25);
const MAX_ABS_ROLL = Number(process.env.FACE_MAX_ABS_ROLL || 25);
const MIN_SHARPNESS = Number(process.env.FACE_MIN_SHARPNESS || 40); // 0..100
const MIN_BRIGHTNESS = Number(process.env.FACE_MIN_BRIGHTNESS || 15);
const MAX_BRIGHTNESS = Number(process.env.FACE_MAX_BRIGHTNESS || 95);

// ГИБКИЕ ограничения на количество лиц
const FACE_MIN_COUNT = Number(process.env.FACE_MIN_COUNT || 1);
const FACE_MAX_COUNT = Number(process.env.FACE_MAX_COUNT || 10);

// Категории, блокирующие модерацию
const BLOCKED_CATEGORIES = new Set([
  'Violence','Graphic Violence','Weapons','Hate Symbols',
  'Explicit Nudity','Sexual Activity','Sexual Content',
  'Visually Disturbing','Self-Harm','Drugs','Alcohol','Tobacco',
]);

const rekognition = new RekognitionClient({ region: AWS_REKOGNITION_REGION });
const s3 = new S3Client({ region: AWS_REGION });

// Универсально превращаем Body в Buffer
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
  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }
  throw new Error('Unsupported GetObject Body type');
}

async function getObjectBytes(Bucket, Key) {
  const out = await s3.send(new GetObjectCommand({ Bucket, Key }));
  return await bodyToBuffer(out.Body);
}

async function deleteS3Object(Key) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key }));
  } catch (err) {
    console.error('Delete S3 object error:', err);
  }
}

function buildDebug(obj) {
  return ENABLE_DEBUG ? obj : undefined;
}

async function validateUserPhoto(req, res) {
  console.log('validateUserPhoto hit');

  try {
    const { key } = req.body || {};
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ ok: false, reason: 'key is required' });
    }
    if (!S3_BUCKET || !AWS_REGION || !AWS_REKOGNITION_REGION) {
      return res.status(500).json({ ok: false, reason: 'Server is misconfigured (regions/bucket)' });
    }

    // Проверим, что объект существует
    try {
      await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    } catch {
      return res.status(400).json({ ok: false, reason: 'Object not found in S3' });
    }

    // Считываем байты из S3
    const imageBytes = await getObjectBytes(S3_BUCKET, key);

    // Модерация
    const modResp = await rekognition.send(new DetectModerationLabelsCommand({
      Image: { Bytes: imageBytes },
      MinConfidence: MODERATION_THRESHOLD,
    }));

    const labels = Array.isArray(modResp.ModerationLabels) ? modResp.ModerationLabels : [];
    const blocked = labels.filter(l => {
      const conf = l.Confidence || 0;
      const name = l.Name || '';
      const parent = l.ParentName || '';
      return conf >= MODERATION_THRESHOLD && (BLOCKED_CATEGORIES.has(name) || BLOCKED_CATEGORIES.has(parent));
    });

    if (blocked.length > 0) {
      await deleteS3Object(key);
      return res.status(422).json({
        ok: false,
        reason: 'Запрещенный контент на фото',
        labels: blocked.map(l => ({ name: l.Name, confidence: l.Confidence })),
        debug: buildDebug({ rawLabels: labels }),
      });
    }

    // Распознавание лиц (расширенные атрибуты)
    const facesResp = await rekognition.send(new DetectFacesCommand({
      Image: { Bytes: imageBytes },
      Attributes: ['ALL'],
    }));

    const faces = Array.isArray(facesResp.FaceDetails) ? facesResp.FaceDetails : [];

    // Гибкая проверка количества лиц: от FACE_MIN_COUNT до FACE_MAX_COUNT
    if (faces.length < FACE_MIN_COUNT || faces.length > FACE_MAX_COUNT) {
      await deleteS3Object(key);
      return res.status(422).json({
        ok: false,
        reason: `На фото должно быть от ${FACE_MIN_COUNT} до ${FACE_MAX_COUNT} человек`,
        debug: buildDebug({ count: faces.length }),
      });
    }

    // Проверяем лица: фото валидно, если ХОТЯ БЫ ОДНО лицо проходит пороги качества.
    // Это позволяет принимать фото пользователя в компании друзей.
    // Сортируем по относительному размеру (крупнее вперед) — чаще всего главное лицо больше.
    faces.sort((a, b) => {
      const sa = Math.min(a?.BoundingBox?.Width || 0, a?.BoundingBox?.Height || 0);
      const sb = Math.min(b?.BoundingBox?.Width || 0, b?.BoundingBox?.Height || 0);
      return sb - sa;
    });

    const evaluations = faces.map((face, idx) => {
      const conf = face.Confidence || 0;
      const pose = face.Pose || {};
      const quality = face.Quality || {};
      const box = face.BoundingBox || {};

      const yaw = Math.abs(pose.Yaw ?? 0);
      const pitch = Math.abs(pose.Pitch ?? 0);
      const roll = Math.abs(pose.Roll ?? 0);
      const sharpness = quality.Sharpness ?? 100;   // если нет — считаем норм
      const brightness = quality.Brightness ?? 50; // среднее по умолчанию
      const minSide = Math.min(box.Width || 0, box.Height || 0);

      const pass =
        conf >= FACE_CONFIDENCE_MIN &&
        minSide >= FACE_MIN_RELATIVE_SIZE &&
        yaw <= MAX_ABS_YAW &&
        pitch <= MAX_ABS_PITCH &&
        roll <= MAX_ABS_ROLL &&
        sharpness >= MIN_SHARPNESS &&
        brightness >= MIN_BRIGHTNESS &&
        brightness <= MAX_BRIGHTNESS;

      return {
        index: idx,
        pass,
        confidence: conf,
        minSide,
        pose: { yaw, pitch, roll },
        quality: { sharpness, brightness },
      };
    });

    const anyPass = evaluations.some(e => e.pass);

    if (!anyPass) {
      await deleteS3Object(key);
      return res.status(422).json({
        ok: false,
        reason: 'Низкое качество распознавания лица или условия съемки',
        debug: buildDebug({
          count: faces.length,
          faces: evaluations,
          thresholds: {
            FACE_CONFIDENCE_MIN,
            FACE_MIN_RELATIVE_SIZE,
            MAX_ABS_YAW,
            MAX_ABS_PITCH,
            MAX_ABS_ROLL,
            MIN_SHARPNESS,
            MIN_BRIGHTNESS,
            MAX_BRIGHTNESS,
          }
        })
      });
    }

    // Успех
    return res.json({
      ok: true,
      debug: buildDebug({ count: faces.length, faces: evaluations })
    });

  } catch (err) {
    console.error('validateUserPhoto error:', err);
    return res.status(500).json({ ok: false, reason: 'Internal validation error' });
  }
}

module.exports = { validateUserPhoto };

