const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'menu', // Puedes cambiar el nombre de la carpeta en Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const upload = multer({ storage: storage });

// Ruta para subir una imagen con manejo de errores detallado
router.post('/', (req, res, next) => {
  upload.single('imagen')(req, res, function (err) {
    if (err) {
      // Mostrar el error real en los logs
      console.error('Error al subir imagen:', err);
      return res.status(500).json({ error: err.message || 'Error al subir imagen' });
    }
    console.log('Archivo recibido:', req.file);
    if (!req.file) {
      console.error('No se subió archivo');
      return res.status(400).json({ error: 'No se subió archivo' });
    }
    res.json({ url: req.file.path });
  });
});

module.exports = router;
