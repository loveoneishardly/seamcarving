const conn = require('../models/database');
const mysqlUtilities = require('mysql-utilities');
const fs = require('fs');
const xml2js = require('xml2js');
const he = require('he');

module.exports = function(app, obj){
    mysqlUtilities.upgrade(conn);
    mysqlUtilities.introspection(conn);

    app.get("/", function(req, res){
        res.render("index", {
            obj: obj,
            i18n: res
        });
    });

    app.post('/readfileXML', function(req, res){
        res.redirect('/');
    });

    app.get("*", function(req,res){
        res.render('../views/404');
    });
}