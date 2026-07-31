import multer from 'multer';
import path from 'path';

// Storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },

  filename(req, file, cb) {
    cb(
      null,
      `${Date.now()}-${file.originalname}`
    );
  }
});

function checkFileType(req, file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = file.originalname ? filetypes.test(path.extname(file.originalname).toLowerCase()) : false;
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only (jpg, jpeg, png, webp)'));
  }
}

const upload = multer({
  storage,
  fileFilter: checkFileType
});

export default upload;