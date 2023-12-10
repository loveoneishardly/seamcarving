const conn = require('../models/database');
const mysqlUtilities = require('mysql-utilities');
const fs = require('fs');
const xml2js = require('xml2js');
const he = require('he');
const bodyParser = require('body-parser');

module.exports = function(app, obj){
    mysqlUtilities.upgrade(conn);
    mysqlUtilities.introspection(conn);
    app.use(bodyParser.json());

    app.get("/", function(req, res){
        res.render("index", {
            obj: obj,
            i18n: res
        });
    });

    app.get("/test", function(req, res){
        res.render("test", {
            obj: obj,
            i18n: res
        });
    });

    // app.post('/generateGIF', function(req, res){
    //     console.log(req.body.frames);
    // });

    app.get("*", function(req,res){
        res.render('../views/404');
    });
}