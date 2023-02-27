const express=require("express")
const cors=require("cors")
const mongoose=require("mongoose")
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const connection =require("./Config/db")
const dotenv=require("dotenv")
const bcrypt=require("bcrypt")
const User = require('./Model/user.model');
const multer = require('multer');
const PlaceModel = require("./Model/place.schema");
const BookingModel = require("./Model/booking.schema");
const imageDownloader = require('image-downloader');
const fs=require("fs")




const app=express()
app.use(cookieParser());
app.use(express.json())
app.use(cors({
  credentials: true,
  origin: 'http://localhost:3000',
}));


function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token,process.env.SECRET_KEY, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}


app.get("/get",(req,res)=>{
    res.send("hello")
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
      // console.log(userDoc)
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
        }, process.env.SECRET_KEY,{}, async(err,token) => {
          if (err) throw err;
          res.cookie('token', token).send(userDoc);
          console.log(userDoc)
        });
      } else {
        res.status(422).send('pass not ok');
      }
    } else {
      res.send(' user not exist not found');
    }
  });

  app.get('/profile', (req,res) => {
    const {token} = req.cookies;
    if (token) {
      jwt.verify(token,  process.env.SECRET_KEY,{}, async (err, userData) => {
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


  const photosMiddleware = multer({dest:'uploads/'});
app.post('/upload', photosMiddleware.array('photos', 100), (req,res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const {path,originalname} = req.files[i];
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace('uploads/',''));
  }
  res.json(uploadedFiles);
});


app.post('/upload-by-link', async (req,res) => {
  const {link} = req.body;
  const newName = 'photo' + Date.now() + '.jpg';
  await imageDownloader.image({
    url: link,
    dest: __dirname + '/uploads/' +newName,
  });
  res.json(newName);
});

  app.post('/places', (req,res) => {
    const {token} = req.cookies;
    const {
      title,address,addedPhotos,description,price,
      perks,extraInfo,checkIn,checkOut,maxGuests,
    } = req.body;
    jwt.verify(token, process.env.SECRET_KEY, {}, async (err, userData) => {
      if (err) throw err;
      const placeDoc = await PlaceModel.create({
        owner:userData.id,price,
        title,address,photos:addedPhotos,description,
        perks,extraInfo,checkIn,checkOut,maxGuests,
      });
      res.json(placeDoc);
    });
  });


  app.get('/user-places', (req,res) => {
    const {token} = req.cookies;
    jwt.verify(token,process.env.SECRET_KEY, {}, async (err, userData) => {
      const {id} = userData;
      res.json( await PlaceModel.find({owner:id}) );
    });
  });

  // app.get('/user-places', (req,res) => {
  //   const {token} = req.cookies;
  //   jwt.verify(token, process.env.SECRET_KEY, {}, async (err, userData) => {
  //     const {id} = userData;
  //     res.json( await Place.find({owner:id}) );
  //   });
  // });

  app.get('/places/:id', async (req,res) => {
    const {id} = req.params;
    res.json(await PlaceModel.findById(id));
  });


  app.get('/places', async (req,res) => {
    res.json( await PlaceModel.find() );
  });
  app.post('/bookings', async (req, res) => {
    const userData = await getUserDataFromReq(req);
    const {
      place,checkIn,checkOut,numberOfGuests,name,phone,price,
    } = req.body;
    BookingModel.create({
      place,checkIn,checkOut,numberOfGuests,name,phone,price,
      user:userData.id,
    }).then((doc) => {
      res.json(doc);
    }).catch((err) => {
      throw err;
    });
  });

  app.get('/bookings', async (req,res) => {
    const userData = await getUserDataFromReq(req);
    res.json( await BookingModel.find({user:userData.id}).populate('place') );
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