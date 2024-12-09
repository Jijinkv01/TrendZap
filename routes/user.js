let express=require("express")
let router=express.Router()
let userController=require("../controller/userController")
const passport = require("../db/passport")
// const {userAuth} = require("../middlewares/auth")
const auth = require("../middlewares/auth")





function isAuthenticated(req,res,next){
    if(req.isAuthenticated()){
      return next()
    } 
       res.redirect("/login")
    }
 
 

router.get("/newUserAuth",userController.loadNewUserAuth)

router.get("/signup",userController.loadsignup)


router.get("/login",userController.loadlogin)

router.get("/home",userController.loadhomepage)

router.post("/signup",userController.signuppage)

router.post("/login",userController.loginpage)

router.get("/verifyOtp",userController.loadverifyOtp)
 
router.post("/verifyOtp",userController.verifyOtp)

router.post("/resend-otp",userController.resendOtp)

router.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}))

router.get("/auth/google/callback",
   passport.authenticate("google",{failureRedirect:"/signup"}),
   (req,res)=>{
      req.session.user = req.user
   res.redirect("/home")
   
})

router.get("/logout", userController.logout)

router.get("/product", userController.loadProductPage)
router.get("/productDetails/:id", userController.loadProductDetails)
router.get("/userProfile", auth.userAuth, userController.loadUserProfile)
router.get('/profile', auth.userAuth, userController.editUser)
router.put('/updateProfile', auth.userAuth, userController.updateUser)
router.put("/changePassword", auth.userAuth, userController.changePassword)

router.get("/userAddress", auth.userAuth, userController.userAddress)
router.post("/addAddress", auth.userAuth, userController.addAddress)
router.delete("/deleteAddress/:id", auth.userAuth, userController.deleteAddress)
router.put("/editAddress/:id", auth.userAuth, userController.editAddress)

router.get("/cart", auth.userAuth, userController.loadCart)
router.post('/cart/check-stock/:id', auth.userAuth, userController.check_stock)
router.post('/cart/add/:id', auth.userAuth, userController.addCart)
router.patch("/updateQuantity", auth.userAuth, userController.updateQuantity)
router.delete("/deleteCart/:id", auth.userAuth, userController.deleteCart)

router.get("/filterProducts", userController.filterProducts)
router.get("/searchProducts", userController.searchProducts)

router.get("/checkout", auth.userAuth, userController.loadCheckout)
router.get("/orderConfirm", auth.userAuth, userController.loadOrderConfirm)
router.post("/placeOrder", auth.userAuth, userController.placeOrder)

router.get("/trackOrder", auth.userAuth, userController.trackOrder)
router.get('/orders', auth.userAuth, userController.getOrderHistory);
router.get("/orderDetails/:id", auth.userAuth, userController.orderDetails)
router.patch("/cancelOrder/:id", auth.userAuth, userController.cancelOrder)
router.post("/createOrder", auth.userAuth, userController.createOrder)

router.get("/wishlist", auth.userAuth, userController.loadWishlist)
router.post("/wishlist/add", auth.userAuth, userController.addWishlist)
router.delete("/deleteWishlist/:id", auth.userAuth, userController.deleteWishlist)
router.post("/applyCoupon", auth.userAuth, userController.applyCoupon)

router.get("/wallet", auth.userAuth, userController.loadWallet)
router.post("/returnOrder", auth.userAuth, userController.returnOrder)
router.post("/saveFailedOrder", auth.userAuth, userController.saveFailedOrder)
router.post("/retry-payment", auth.userAuth, userController.retryPayment)
router.post("/capture-payment", auth.userAuth, userController.verifyPayment)
router.get("/downloadInvoice/:id", auth.userAuth, userController.downloadInvoice)



module.exports=router