const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    discount: {
        type: Number, // Percentage discount (e.g., 10 for 10%)
        required: true,
    },
    applicableTo: {
        type: String,
        enum: ["product", "category"], // Specify if the offer applies to specific products or categories
      // required: true,
    },
    applicableIds: {
        type: [mongoose.Schema.Types.ObjectId], // Array of product or category IDs
        refPath: "applicableTo", // Dynamically reference either "Product" or "Category"
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    maxUses: {
        type: Number, // Max uses across all users
        default: 0, // 0 means unlimited
    },
    usedCount: {
        type: Number, // Track how many times the offer has been used
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true, // Controls if the offer is active or not
    },
});

const Offer = mongoose.model("Offer", offerSchema);
module.exports = Offer;