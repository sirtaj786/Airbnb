const express=require("express")
const cors=require("cors")
const mongoose=require("mongoose")
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const connection =require("./Config/db")
const dotenv=require("dotenv")
const bcrypt=require("bcrypt")
const User = require('./Model/user.model');

const app=express()
app.use(cookieParser());
app.use(express.json())
app.use(cors)


app.get("/get",(req,res)=>{
    res.send("hello")
})
app.get("/",(req,res)=>{
  res.send("welcome")
})

app.post('/register', async (req,res) => {
    const { name,email, password } = req.body;
    await bcrypt.hash(password, 6, function (err, hash) {
      if (err) {
        res.send("Please try again");
      }
      const user = new User({
        name,
        email,
        password: hash,
      });
      user.save();
      res.send("SignUp Successfull ");
    });
  
  });
  app.post('/login', async (req,res) => {
    const {email,password} = req.body;
    const userDoc = await User.findOne({email});
    if (userDoc) {
      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk) {
        jwt.sign({
          email:userDoc.email,
          id:userDoc._id
        }, process.env.SECRET_KEY, {}, (err,token) => {
          if (err) throw err;
          res.cookie('token', token).send(userDoc);
        });
      } else {
        res.status(422).send('pass not ok');
      }
    } else {
      res.send('not found');
    }
  });

  app.get('/profile', (req,res) => {
    const {token} = req.cookies;
    if (token) {
      jwt.verify(token,  process.env.SECRET_KEY, {}, async (err, userData) => {
        if (err) throw err;
        const {name,email,_id} = await User.findById(userData.id);
        res.send({name,email,_id});
      });
    } else {
      res.send(null);
    }
  });
  
  app.post('/logout', (req,res) => {
    res.cookie('token', '').send(true);
  });

app.listen(process.env.PORT,async()=>{
    try {
        await connection;
        console.log("Connected to server");
      } catch (err) {
        console.log("Error in connection", err);
      }
      console.log(`Listen on port ${process.env.PORT}`);
    });