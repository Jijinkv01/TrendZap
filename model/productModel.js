const mongoose = require("mongoose")
const Category = require("./categoryModel")
const {Schema} = mongoose

const productSchema = new Schema({
    name : {
        type:String,
        required:true,
    },
    description : {
        type:String,
        required:true,
    },
    brand : {
        type:String,
        required:true
    },
    category : {
        type:Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    regularPrice : {
        type:Number,
        required:true
    },
    salesPrice : {
        type:Number,
        required:true
    },
    offer : {
        type:Number,
        default:true
    },
    quantity : {
        type:Number,
        default:true
    },
    color : {
        type:String,
        required:true
    },
    image : {
        type:[String],
        required:true
    },
    isBlocked : {
        type:Boolean,   
        default:false,
    },
    // status : {
    //     type:String,
    //     enum:["Available","out of stock"],
    //     required:true,
    //     default:"Available"
    // },


},{timestamps:true})



const Product = mongoose.model("Product",productSchema)

module.exports=Product
