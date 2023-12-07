var mysql = require('mysql');

var conn = mysql.createConnection({
  host: '10.97.13.160', 
  user: 'root',      
  password: 'Vnpt@123',
  //password: '',
  //database: 'qlcangca' 
  database: 'appdemo' 
});

module.exports = conn;