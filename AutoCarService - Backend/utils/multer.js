const multer  = require('multer');
const path    = require('path');

// Carpeta destino
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'imagenes'));
  },
  filename: (req, file, cb) => {
    const ext   = path.extname(file.originalname);           // .png .jpg …
    const name  = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});

// Filtro de tipo
function fileFilter (req, file, cb) {
  const allowed = /jpg|jpeg|png|webp/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase());
  ok ? cb(null, true) : cb(new Error('Solo imágenes jpg, jpeg, png, webp'));
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});
