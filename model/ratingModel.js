const mongose = require("mongoose")
const {Schema} = mongoose
const User = require("./userModel")
const Product = require("./productModel")
const { default: mongoose } = require("mongoose")


const ratingSchema = new mongoose.Schema({
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    rating:{
        type:Number,
        required:true,
        min:1,
        max:5
    },
    comment:{
        type:String,
        maxlength:500
    },
    createdAt:{
        type:Date,
        default:Date.now
    }

})

const Rating = mongoose.model("Rating",ratingSchema)

module.exports = Rating