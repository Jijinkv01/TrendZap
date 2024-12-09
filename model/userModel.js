const mongoose = require("mongoose")
const {Schema}=mongoose

const userSchema= new Schema({
    username : {
        type:String,
        required:true
    },
    googleId: {
        type:String,
        // unique:true,
    },
    email : {
        type:String,
        required:true,
        unique:true
    },
    password : {
        type:String,
        required:false
    },
    isBlocked: {
        type:Boolean,
        default:false
    },
    createdAt : {
        type:Date,
        default:Date.now
    },
    isAdmin : {
        type:Boolean,
        default:false
    },
    phone : {
        type:Number,
        required:false
    }

    
})


const User =mongoose.model("User",userSchema)
module.exports=User