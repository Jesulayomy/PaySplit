const multer = require("multer");
const path = require("path");


const fileFilter = (req, file, cb) => {
  let ext = path.extname(file.originalname).toLowerCase();
  if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
    cb(new Error("File type is not supported"), false);
    return;
  }
  cb(null, true);
}

module.exports = { 
  diskUpload: multer({
    storage: multer.diskStorage({}),
    fileFilter
  }),
  memoryUpload: multer({
    storage: multer.memoryStorage(),
    fileFilter,
  })
};
