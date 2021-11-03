const { response } = require('express');
const mysql = require('mysql');

var db;

function connection(){
    const db = mysql.createConnection({
        host: 'remotemysql.com',
        user: '9BqvzyD6XP',
        password: 't00IhGtbUp', 
        database: '9BqvzyD6XP',
        port: '3306'
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
    
    