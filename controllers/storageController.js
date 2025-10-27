require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// S3 клиент
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET || 'uploads-photo';
const USER_PREFIX = 'tmp/'; // будет tmp/{userId}/

// Определяем расширение по имени файла или content-type
function extFromFilenameOrMime(filename, contentType) {
  const lowerName = String(filename || '').toLowerCase();
  const match = lowerName.match(/\.(jpe?g|png|webp|heic|heif)$/);
  if (match) return match;
  const ct = String(contentType || '').toLowerCase();
  switch (ct) {
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/heic':
      return '.heic';
    case 'image/heif':
      return '.heif';
    default:
      return '.jpg';
  }
}

function userKeyPrefix(userId) {
  return `${USER_PREFIX}${String(userId)}/`;
}

function normalizeQueryStringParam(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value;
  return undefined;
}

// Контроллер: получение presigned URL
async function getPresignedUploadUrl(req, res) {
  try {
    // Требуем авторизованного пользователя (миделварь уже проверила токен и scope)
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Читаем и нормализуем query-параметры
    const filename = normalizeQueryStringParam(req.query.filename);
    const contentType = normalizeQueryStringParam(req.query.contentType);

    if (!filename || !contentType) {
      return res.status(400).json({ message: 'filename и contentType обязательны' });
    }

    // Генерируем ключ
    const ext = extFromFilenameOrMime(filename, contentType);
    const key = `${userKeyPrefix(userId)}${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;

    // Формируем команду и presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });

    // Время жизни ссылки можно регулировать через env
    const expiresIn = Number(process.env.S3_PRESIGNED_TTL || 60);

    const url = await getSignedUrl(s3, command, { expiresIn });

    return res.json({
      url,
      key,
      bucket: BUCKET,
      expiresIn,
    });
  } catch (err) {
    console.error('[presigned-upload] error:', err);
    return res.status(500).json({ message: 'Error generating presigned URL' });
  }
}

module.exports = {
  getPresignedUploadUrl,
};
