const mongoose = require("mongoose")
const {scheema} = mongoose

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    discount: {
        type: Number,
        required: true,
    },
    minPurchase: {
        type: Number, 
        default: 0,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    maxUses: {
        type: Number,
        default: 1,
    },
    usedCount: {
        type: Number, 
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },

})

const Coupon = mongoose.model("Coupon",couponSchema);
module.exports = Coupon;
