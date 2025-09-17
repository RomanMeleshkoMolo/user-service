const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ
const ALLOWED_MIME = ['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif'];


const storage = multer.diskStorage({
  destination: async (req, file, cb) => {

    try {
      const userId =
        req.user?._id ||
        req.user?.id ||
        req.auth?.userId ||
        req.regUserId ||
        req.userId;

      const dir = path.join(process.cwd(), 'uploads', 'user-photos', String(userId || 'anonymous'));
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}_${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Недопустимый тип файла'));
};

const uploadPhotos = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 30 },
  fileFilter,
});

module.exports = { uploadPhotos };
