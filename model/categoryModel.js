const mongoose = require('mongoose');
const {Schema} = mongoose

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isdeleted : {
        type:Boolean,
        default:false
    },
    isListed : {
        type:Boolean,
        default:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
