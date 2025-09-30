// // routes/storage.js
// const express = require('express');
// const router = express.Router();
// const AWS = require('aws-sdk');
//
// const s3 = new AWS.S3({
//   region: process.env.AWS_REGION,
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// });
//
// const BUCKET = process.env.S3_BUCKET;
// const UPLOAD_PREFIX = 'user-photos/';
//
// router.get('/storage/presigned-upload', (req, res) => {
//   const { filename, contentType } = req.query;
//   const key = `${UPLOAD_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2)}_${filename}`;
//
//   const params = {
//     Bucket: BUCKET,
//     Key: key,
//     Expires: 60, // TTL presigned URL
//     ContentType: contentType,
//     ACL: 'private',
//   };
//
//   s3.getSignedUrl('putObject', params, (err, url) => {
//     if (err) {
//       console.error('presigned error', err);
//       return res.status(500).json({ message: 'Error generating presigned URL' });
//     }
//     res.json({ url, key });
//   });
// });
//
// module.exports = router;



// routes/storage.js
require('dotenv').config();
const express = require('express');
const router = express.Router();

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Настройка клиента S3 (креды подхватятся из env/CLI/роли автоматически)
const s3 = new S3Client({
  region: process.env.AWS_REGION, // пример: 'eu-central-1'
  // Если хотите явно задать креды из env:
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET || 'uploads-photo'; // ваш бакет
const UPLOAD_PREFIX = 'user-photos/';

// GET /storage/presigned-upload?filename=...&contentType=...
router.get('/storage/presigned-upload', async (req, res) => {
  try {
    const { filename, contentType } = req.query;

    if (!filename || !contentType) {
      return res.status(400).json({ message: 'filename и contentType обязательны' });
    }

    const key = `${UPLOAD_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2)}_${filename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      // ACL: 'private' // по умолчанию и так private; можно не указывать
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60 }); // 60 секунд

    res.json({ url, key, bucket: BUCKET });
  } catch (err) {
    console.error('presigned error', err);
    res.status(500).json({ message: 'Error generating presigned URL' });
  }
});

module.exports = router;

