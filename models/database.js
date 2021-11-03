const { response } = require('express');
const mysql = require('mysql');

var db;

function connection(){
    const db = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '', 
        database: 'monidb'
    });

    db.connect((err)=>{
        if(err){
            throw err;
        }
        console.log('Connection', 'Success for all routes');
    });

    return db;
}

module.exports = connection();
    
    