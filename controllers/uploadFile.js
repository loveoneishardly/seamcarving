var multer  = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/upload')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now()  + "-" + file.originalname)
    }
});  

var upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        console.log(file);
        if( file.mimetype == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            file.mimetype=="image/jpg" || file.mimetype=="image/jpeg" || file.mimetype == "text/xml" || file.mimetype=="image/png"
        ){
            cb(null, true)
        }else{
            return cb(new Error('only xml and excel!'))
        }
    }
}).single("file_image");


module.exports = function(app, obj){
    app.post("/uploadFile", function(req, res){
        upload(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                res.json({result:false, errMsg:"A Multer error occurred when uploading."});
            } else if (err) {
                res.json({result:false, errMsg:"An unknown error occurred when uploading." + err});
            }else{
                console.log("Upload is okay");
                console.log(req.file); // Thông tin file đã upload
                res.json({result:true, file: req.file.filename});
            }
        });
    });
}