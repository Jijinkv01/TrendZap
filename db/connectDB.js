let mongoose=require("mongoose")
let env=require("dotenv").config()

let connectDB=async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("DB Connected")
    } catch (error){
        console.log("DB Connection error",error.message)
        process.exit(1)
    }
}

module.exports=connectDB