let express = require("express")
let router = express.Router()
let adminController = require("../controller/adminController")
const auth = require("../middlewares/auth")
const customerController = require("../controller/admin/customerController")
const categoryController = require("../controller/admin/categoryController")
const productController = require("../controller/admin/ProductController")
const categories = require("../controller/adminController")
const upload = require("../config/multer")
const orderController = require("../controller/admin/orderController")


router.get("/pageerror", adminController.pageerror)

router.get("/login", auth.isAdminLogin, adminController.loadlogin)

router.post("/login", auth.isAdminLogin, adminController.login)

router.get("/dashboard", auth.adminAuth, adminController.loaddashboard)

router.get("/logout", auth.adminAuth, adminController.logout)

router.get("/usermanagement", auth.adminAuth, adminController.loadusermanagement)
router.post("/blockuser", auth.adminAuth, customerController.blockuser)  


router.get("/category/", auth.adminAuth, adminController.loadcategory)
router.post('/addcategory', auth.adminAuth, categoryController.addcategory)
router.put("/updatecategory/:id", auth.adminAuth, categoryController.updatecategory)
router.patch("/deletecategory/:id", auth.adminAuth, categoryController.deleteCategory)
router.post("/disableCategory", auth.adminAuth, categoryController.blockCategory)   

router.get("/product", auth.adminAuth, adminController.loadProduct)
router.post("/addProduct", auth.adminAuth, upload, productController.addProduct)
router.put("/editProduct/:id", auth.adminAuth, upload, productController.editProduct)

router.delete("/deleteProductImage", productController.deleteProductImage)

router.post("/blockProduct/:id", auth.adminAuth, productController.blockProduct)
router.put("/unBlockProduct/:id", auth.adminAuth, productController.unBlockProduct)
router.get("/orderManagement", auth.adminAuth, adminController.loadOrderManagement)
router.patch("/changeOrderStatus", auth.adminAuth, orderController.changeOrderStatus)

router.get("/coupon", auth.adminAuth, adminController.loadCoupon)
router.post("/addCoupon", auth.adminAuth, adminController.addCoupon)
router.delete("/removeCoupon/:id", auth.adminAuth, adminController.removeCoupon)
router.get("/getReturnRequest/:id", auth.adminAuth, adminController.getReturnRequest)

router.post("/updateReturnRequestStatus", auth.adminAuth, adminController.updateReturnRequestStatus)
router.get("/sales-report", auth.adminAuth, adminController.loadSalesReport)

router.get("/offerManagement", auth.adminAuth, adminController.loadOfferManagement)
router.post("/addOffer", auth.adminAuth, adminController.addOffer)
router.delete("/deleteOffer/:id", auth.adminAuth, adminController.deleteOffer)

router.get("/download/excel", auth.adminAuth, adminController.downloadExcel)
router.get("/download/pdf", auth.adminAuth, adminController.downloadPdf)
router.get("/best-sellingData", auth.adminAuth, adminController.bestSellingData)




module.exports = router