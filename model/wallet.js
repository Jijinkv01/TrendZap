const mongoose = require("mongoose")
const User = require("./userModel")

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
      },
      balance: {
        type: Number,
        required: true,
        default: 0, 
        min: 0, 
      },
      transactions: [
        {
          transactionId: {
            type: String,
            required: true,
            unique: true, 
          },
          type: {
            type: String,
            enum: ['credit', 'debit'],
            required: true,
          },
          amount: {
            type: Number,
            required: true,
            min: 0, 
          },
          date: {
            type: Date,
            default: Date.now,
          }
        },
      ],
    }, { timestamps: true });

    const Wallet = mongoose.model("Wallet",walletSchema)

    module.exports = Wallet