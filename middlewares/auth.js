const User = require("../model/userModel")


const userAuth = (req,res, next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next()
            } else {
                res.redirect("/login")
            }
        })
        .catch(error=>{
            console.log("Error in user auth middleware")
            res.status(500).send("Internal server error")
        })
    } else {
        res.redirect("/newUserAuth")
    }
}



const adminAuth = (req,res,next)=>{
  if(req.session.admin){
    next()
  }
  else {
    res.redirect("/admin/login")
  }
}


const isAdminLogin = (req,res,next)=>{
    if(req.session.admin){
        res.redirect("/admin/dashboard")
    } else{
        next()
    }
}





module.exports={
    userAuth,
    adminAuth,
    isAdminLogin
    // checkSession
}