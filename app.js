const express = require('express');
const bodyParser = require('body-parser');
const agentRoute = require('./controllers/agents');

var app = express();
app.use('/api/agent/', agentRoute);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}))

var PORT = process.env.PORT || 2000;

app.get('/', (req, res)=>{
    res.status(200).json({
        status: true,
        message:'Welcome to Moni api',
        token:"token here"
    })
})

app.listen(PORT, ()=> console.log("Server at port", PORT))