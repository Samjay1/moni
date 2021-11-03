const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv/config');




function VerifyToken (req, res, next){ 
    var token = req.headers['token'];

    if(!token) {
       return res.status(403).send({ auth: false, message: 'No token provided.' });
    }
    jwt.verify(token, process.env.SECRET_KEY, ((err, wallet_number)=>{
        if(err) return res.status(500).send({ status: false, message: 'Failed to authenticate token.' });
      
        // console.log('Decode Token:',UserID);
        console.log('Decode text:',wallet_number.wallet_number);
        req.wallet_number = wallet_number.wallet_number;
        next();
    }));
  }
  
  module.exports = VerifyToken;