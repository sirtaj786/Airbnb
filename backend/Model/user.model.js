const mongoose=require("mongoose")

const UserScheme= new mongoose.Schema({
    name:{type:String,required:true},
    email: {type:String, unique:true,rquired:true},
  password: {type:String,rquired:true}
})

const UserModel=mongoose.model("user",UserScheme)

module.exports=UserModel