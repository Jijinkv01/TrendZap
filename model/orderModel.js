const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [
        {
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true
            },
           
        }
    ],
    returnRequest: {
        reason: { type: String },
        status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: null }
      },
    totalAmount: {
        type: Number,
        required: true
    },
    discount: { 
        type: Number,
        default: 0
     },
    address: {
        firstName: { type: String, required: true },
        lastName :{ type: String, required: true },
        streetAddress: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true }
        
    },
    paymentMethod: {
        type: String,
        enum: ['Razorpay', 'cod'],
        required: true
    },
    paymentStatus: {
        type:String,
        default:"Success"
    },
    retryable: { 
        type: Boolean,
        default: true 
    },
  
    orderStatus: {
        type: String,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled','Payment Failed'],
        default: 'Processing'
    },

    

    orderDate: {
        type: Date,
        default: Date.now
    },

    hasReturnRequest: {
        type:Boolean,
        default:false
    }
   
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

