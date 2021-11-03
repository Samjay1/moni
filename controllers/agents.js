const router = require('express').Router();
const bodyParser = require('body-parser');
const { response } = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const mysql = require("mysql");
const verifyToken = require('../verifyToken');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}))
//client_db class
const agent_db = require('../models/agent_db.js');  

// instatiate client_db
let Agent = new agent_db();


// GET TOKEN ON LOGIN
router.post('/login', async (req, res)=>{
    var email = req.body.email;
    var password = req.body.password;

    //CHECK Phone and Password if empty
    if(!email || !password){
        console.log('ILOG', "empty parameters")
        res.status(404).send({
            status: false, 
            message: 'Enter all login details!'
        })
        return;
    }
       Agent.get_user(email, (response)=>{
        //    console.log("Client Password:", response  ),
            if(response.status==true){
                // console.log("Client Password:", response.response.password)
                bcrypt.compare(password, response.response.password).then((result)=>{
            // generate token here with UserID 
                var token = jwt.sign({wallet_number: response.response.wallet_number }, process.env.SECRET_KEY);
                if(result ==true){
                    console.log('bcrypt message', result)
                     //sending response 
                    return res.send({
                        status: true,
                        token: token,
                        message: 'user login successful',
                        other:response.message,
                        user: response.response
                    }) 
                }else{
                    res.status(404).send({
                        status: false, 
                        message: 'password incorrect!', 
                    })
                }
           }).catch((err)=>{ 
               res.status(404).send({
                status: false, 
                message: 'password error!',
                other:response.message, 
            })
            return;
           })
        }
        else{
            res.status(404).json({
                status: false,
                message: "email can't be empty!",
                other:response.message
            }) 
        } 
    });
     
});

//Get all agents info from agent db
router.get('/all_agents', (req, res)=>{
    Agent.get_all((response)=>{
        if(response.status==true){
               console.log('all agents :>> ',response);
                res.status(200).json({
                status:true,
                message:'All agents request successful',
                data:response.data
            });
        }
        else{
            res.status(404).json({
                status:false,
                message:"All Agent request failed",
            })
        }
     
    })
    
})

//Data Normalization
router.post('/data', (req, res)=>{
    var input = req.body.input;
    
    var reg = /^[a-z]+$/i; // Regular expression for checking alphabets only
    var reg2 = /^[0-9]+/; // Regular expression for checking numbers only

    var dept = ''
    var course = ''
    var year = ''
    var semester = ''
    var change1 = true; //set state for dept and semester
    var change2 = true; //set state for course and year

    var val = input.replace(/-|:/g, ""); // remove all '-' and ':'
    var arr = val.split(''); 
    console.log(input,arr)
    arr.forEach((val)=>{
        if(reg.test(val) && change1){ // Alpha
            // change2 = false;
            dept +=val;
        }else if(reg2.test(val) && change2){ //Numbers
            // change1 = false;
            course+=val;
        }else if(reg.test(val) && !change1){  //Alpha
            change2 = false;
            semester += val;
        }else if(reg2.test(val) && !change2){ //Numbers
            change1 = false;
            year += val;
        }else{
            change1 = false;
            change2 = false;
        }
    })
    console.log('Dept', dept , "\nCourse", course, '\nSemester', semester, '\nYear', year)

    var data = {
        'department': dept,
        'course_number': course,
        'semester': semester,
        'year': year
    }

    res.status(200).json({
        status:true,
        message:'Data Normalization',
        response: data
    })
})



//Get single agent from agent db using wallet_number
router.get('/w/', verifyToken, (req, res)=>{
    var wallet_number = req.wallet_number; 
    
    Agent.get_wn(parseInt(wallet_number), (response)=>{
        if(response.status==true){
            res.status(200).json({
                status:true,
                message:"Agent request successful",
                data:response.data
            })
        }
        else{
            res.status(404).json({
                status:false,
                message:"Agent request failed",
                other: response.message
            })
        }
    })
    
})

//Agent top up wallet
router.post('/top_up', verifyToken, (req, res)=>{
    var wallet_number = req.wallet_number;
    var amount = req.body.amount;

    Agent.top_up(parseFloat(amount), wallet_number, (response)=>{
        if(response.status==true){
            res.status(200).json({
                status:true,
                message:'Top up successful',
                response: response.data
                })
        }else{
            res.status(404).json({
                status:false,
                message:"Agent top up failed",
                other: response.message
            })
        }
    }) 
})


//Agent withdraw from wallet
router.post('/withdraw', verifyToken, (req, res)=>{
    var wallet_number = req.wallet_number;
    var amount = req.body.amount;
    
    Agent.withdraw(wallet_number, parseFloat(amount), (response)=>{
        if(response.status==true){
            res.status(200).json({
                status:true,
                message:'Withdraw request successful',
                response: response.data
                })
        }else{
            res.status(404).json({
                status:false,
                message:"Agent withdrawal failed",
                other: response.message
            })
        }
    }) 
    
})


//Agent request loans
router.post('/request_loan', verifyToken, (req, res)=>{
    var wallet_number = req.wallet_number;
    var amount = req.body.amount;

    Agent.request_loan(wallet_number, parseFloat(amount), (response)=>{
        if(response.status==true){
            res.status(200).json({
                status:true,
                message:'Loan request successful',
                response: response.data
                })
        }else{
            res.status(404).json({
                status:false,
                message:'Loan request failed',
                other: response.message
            })
        }
    })  
})



//Agent repay loans from wallet
router.post('/repay_loan', verifyToken, (req, res)=>{
    var wallet_number = req.wallet_number;
    var amount = req.body.amount;

    Agent.repay_loan(wallet_number, parseFloat(amount), (response)=>{
        if(response.status==true){
            res.status(200).json({
                status:true,
                message:'Loan repaid successfully',
                response: response.data
                })
        }else{
            res.status(404).json({
                status:false,
                message:'Loan repay failed',
                other: response.message
            })
        }
    }) 
})

//Get all transactions based on (start_date, end_date, transaction_type)
router.post('/transactions', verifyToken,  (req, res)=>{
    var wallet_number = req.wallet_number;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var transaction_type = req.body.transaction_type;

    console.log('transactions :>> ');
    Agent.get_transactions(wallet_number,start_date, end_date, transaction_type, (response)=>{
        res.status(200).json({
        status:true,
        message:'All transactions requested',
        data:response
    })
    })
})

 

module.exports = router;