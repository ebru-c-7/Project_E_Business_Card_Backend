const multer = require("multer");
const uuid = require("uuid").v1;

const FILE_TYPE_MAP = {
    'image/png' : 'png',
    'image/jpeg' : 'jpeg',
    'image/jpg' : 'jpg',
}
console.log("file-upload middleware");

const fileUpload = multer({
    limits: 500000,
    storage: multer.diskStorage({
        destination: (req, file, cb)=>{
            cb(null, 'uploads/images')
        },
        filename: (req, file, cb) => {
            const ext = FILE_TYPE_MAP[file.mimetype];
            cb(null, uuid() + "." + ext);
        }
    }),
    fileFilter: (req, file, cb) => {
        const isValid = !!FILE_TYPE_MAP[file.mimetype];
        let error = isValid ? null : new Error("Invalid file type");
        cb(error, isValid);
    }
});  

module.exports = fileUpload;