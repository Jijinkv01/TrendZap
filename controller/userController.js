const User = require("../model/userModel")
const nodemailer = require("nodemailer")
require("dotenv").config()
const bcrypt = require("bcrypt")
const Product = require('../model/productModel')
const Address = require("../model/addressModel")
const Cart = require("../model/cartModel")
const Category = require("../model/categoryModel")
const Order = require("../model/orderModel")
const razorpayInstance = require('../config/razorpay')
const Wishlist = require("../model/wishlist")
const mongoose = require("mongoose")
const Coupon = require("../model/couponModal")
const Wallet = require("../model/wallet")
const crypto = require('crypto');
const PDFDocument = require('pdfkit');




let loadNewUserAuth = (req,res)=>{
    if (req.session.user) {
        res.redirect("/home")
    } else {

        res.render("user/newUserAuth")
    }
   
    
}


let loadsignup = (req, res) => {
    if (req.session.user) {
        res.redirect("/home")
    } else {

        res.render("user/signup")
    }
   
}


let loadverifyOtp = (req, res) => {
    if (req.session.user) {
        res.redirect("/home")
    } else {

        res.render("user/verifyOtp")
    }
    
}


const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {

    }
}



const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body
        console.log(otp)


        if (otp.toString() === req.session.userOtp) {
            const user = req.session.userData
            const passwordHash = await securePassword(user.password)
            const saveUserData = new User({
                username: user.username,
                email: user.email,
                password: passwordHash,
                googleId: user.googleId
            })
            await saveUserData.save()
            req.session.user = saveUserData._id
            res.json({ success: true, redirectUrl: "/home" })
        } else {
            res.status(400).json({ success: false, message: "invalid OTP. Try again" })
        }
    } catch (error) {
        console.error("Error verifying OTP", error)
        res.status(500).json({ succss: false, message: "An error occored" })

    }
}



function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            }
        })

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your Account",
            text: `your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`,
        })
        return info.accepted.length > 0

    } catch (error) {
        console.error("error sending Email", error)
        return false
    }
}



let signuppage = async (req, res) => {
    try {
        const { username, email, password, confirmpassword } = req.body
        if (password !== confirmpassword) {
            return res.render("user/signup", { message: "password do not match" })
        }

        const finduser = await User.findOne({ email })
        if (finduser) {
            return res.render("user/signup", { message: "user with this email already exist" })
        }

        const otp = generateOtp()
        const emailSent = await sendVerificationEmail(email, otp)

        if (!emailSent) {
            return res.json("email-error")
        }

        req.session.userOtp = otp
        req.session.userData = { username, email, password }

        res.render("user/verifyOtp")
        console.log("OTP Sent", otp)
    } catch (error) {
        console.error("signup error", error)
        res.redirect("/pageNotFound")
    }
}




const loadlogin = (req, res) => {
    if (req.session.user) {
        res.redirect("/home")
    } else {

        res.render("user/login")
    }
}



let loadhomepage = async (req, res) => {
   
    const products = await Product.find({ isBlocked: false })
    res.render("user/home", { products })
}


const loginpage = async (req, res) => {

    try {
        const { email, password } = req.body;

        const findUser = await User.findOne({ email });

        if (!findUser) {
            return res.render("user/login", { errorMessage: "User not found" });
        }

        if (findUser.isBlocked) {
            return res.render("user/login", { errorMessage: "Your account is blocked" });
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);

        if (!passwordMatch) {
            return res.render("user/login", { errorMessage: "Incorrect password" });
        }

        req.session.user = findUser._id;
        res.redirect('/home');
    } catch (error) {
        console.error("Login error", error);
        res.render("user/login", { errorMessage: "Login failed. Please try again later" });
    }
}



const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData
        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session" })
        }

        const otp = generateOtp()
        req.session.userOtp = otp
        const emailSent = await sendVerificationEmail(email, otp)
        if (emailSent) {
            console.log("Resend OTP:", otp)
            res.status(200).json({ success: true, message: "OTP Resend successfully" })
        } else {
            res.ststus(500).json({ success: false, message: "Failed to resend OTP, Try again" })
        }
    } catch (error) {
        console.error("Error resending OTP", error)
        res.status(500).json({ success: false, message: "Internal server error, Try again" })
    }
}


const loadProductPage = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    // Get page and limit from query parameters, default to 1 and 9
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;

    // Calculate skip value
    const skip = (page - 1) * limit;

    try {
        // Fetch products with pagination
        const products = await Product.find({ isBlocked: false })
            .skip(skip)
            .limit(limit);

        // Fetch total product count for pagination controls
        const totalProducts = await Product.countDocuments({ isBlocked: false });
        const categories = await Category.find({ isBlocked: false })

        const totalPages = Math.ceil(totalProducts / limit);

        res.render("user/product", { 
            products, 
            categories,
            totalPages, 
            currentPage: page 
        });
    } catch (error) {
        console.error("Error loading product page:", error);
        res.status(500).send("Server Error");
    }
};

const loadProductDetails = async (req, res) => {
    const productId = req.params.id

    res.setHeader("Cache-Control", "no-store")

    try {
        const product = await Product.findById(productId)
        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: product._id }
        }).limit(4)

        if (!product) {
            return res.status(404).send("Product not found");
        }
        res.render("user/productDetails", { product, relatedProducts })
    } catch (error) {
        console.error(error)
        res.status(500).send("internal server error")

    }
}



const productRating = async (req, res) => {
    const { productId } = req.params
    const { rating, comment } = req.body
    const userId = req.user._id;

    try {
        const newRating = new Rating({
            product: priductId,
            user: userId,
            rating: rating,
            comment: comment
        })
        await newRating.save()
        res.json({ message: "Rating submitted successfully" })
    } catch (error) {
        res.status(500).json({ error: "Failed to submit rating" })
    }
}


const logout = async (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.log("Error destroying session", err);
                res.redirect("/pageerror")
            }
            res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "-1");

            res.redirect("/login")
        })
    } catch (error) {
        console.log("unexpected error during logout")
        res.redirect("/pageerror")
    }
}


const loadUserProfile = async (req, res) => {
    try {
        const userId = req.session.user

        const user = await User.findOne({ _id: userId })

        if (!user) {
            return res.redirect("/login")
        }
        res.render("user/userProfile", { user })

    } catch (error) {
        console.log(error)
    }
}


const editUser = async (req, res) => {
    try {
        const userId = req.session.user
        const user = await User.findById(userId, 'username email phone');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
}


const updateUser = async (req, res) => {
    try {
        const userId = req.session.user
        const { username, phone } = req.body;

        // Update user information
        const updatedUser = await User.findByIdAndUpdate(userId, { username, phone }, { new: true });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user profile' });
    }
};


const changePassword = async (req, res) => {
    try {
        const userId = req.session.user
        const { currentPassword, newPassword } = req.body;

        // Fetch the user by ID
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Verify the existing password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

        // Hash the new password and update it
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update password' });
    }
};


const userAddress = async (req, res) => {
    if (req.session.user) {
        try {
            const userId = req.session.user
            const address = await Address.find({ userId: userId })
            res.render("user/address", { address })
        } catch (error) {
            console.error("error fetching product", error)
            res.status(500).send("Internal server error")
        }
    } else {
        res.redirect("/login")
    }
}


const addAddress = async (req, res) => {
    const { firstName, lastName, streetAddress, city, state, postalCode } = req.body
    try {
        const userId = req.session.user
        const addressData = new Address({
            userId: userId,
            firstName: firstName,
            lastName: lastName,
            streetAddress: streetAddress,
            city: city,
            state: state,
            postalCode: Number(postalCode)
        })
        await addressData.save()
        if (req.body.checkout) {
            res.redirect("/checkout")
        } else {
            res.redirect("/userAddress")
        }

    } catch (error) {
        console.error('Error adding address:', error.response || error);
        alert('Failed to add address. Please try again.');
    }

}


const deleteAddress = async (req, res) => {
    const addressId = req.params.id
    try {
        await Address.findByIdAndDelete(addressId)
        res.status(200).json({ success: true, message: "address deleted successfully" })
    } catch (error) {
        console.error('Error deleting address:', error);
        res.ststus(500).json({ success: false, message: "An error occurred while deleting the address." })
    }
}


const editAddress = async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, streetAddress, city, state, postalCode } = req.body;
    // console.log("req.params",req.params)
    // console.log("req.body",req.body)

    try {
        const updatedAddress = await Address.findByIdAndUpdate(
            id,
            { firstName, lastName, streetAddress, city, state, postalCode },
            { new: true }
        )
        if (!updatedAddress) {
            return res.status(404).json({ message: 'Address not found' });
        }
        res.status(200).json({ message: 'Address updated successfully', updatedAddress });
    } catch (error) {
        console.error('Error updating address:', error)
        res.status(500).json({ message: 'Internal server error' });
    }
}


const loadCart = async (req, res) => {
    if (req.session.user) {
        try {
            const userId = req.session.user
            const cart = await Cart.findOne({ userId: userId }).populate("items.productId")

            if (!cart || !cart.items.length) {
                return res.render("user/cart", { cart: { items: [], totalPrice: 0 } });
            }

            // Calculate total price if not stored in the schema
            cart.totalPrice = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
            await cart.save()
            res.render("user/cart", { cart })
        } catch (error) {
            console.error("error fetching cart", error)
            res.status(500).send("Internal server error")
        }
    } else {
        res.redirect("/login")
    }
}



//check stock
const check_stock = async (req, res) => {
    try {
        const productId = req.params.id;


        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: "User not logged in" });
        }

        const userId = req.session.user
        //   console.log("user id:", userId);


        const product = await Product.findById(productId);
        console.log("product is kitti :", product);


        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const cart = await Cart.findOne({ userId });
        let userQuantity = 0;

        const imageUrl = product.image[0];

        if (cart) {
            const item = cart.items.find(
                (item) => item.productId.toString() === productId
            );
            // console.log("cart items kitti:", item);
            // console.log("image url kitti:", imageUrl)

            if (item) {
                userQuantity = item.quantity;
            }
        }

        if (product.quantity <= 0) {
            return res.status(200).json({
                inStock: false,
                userQuantity,
                availableStock: 0,
            });
        } else {
            return res.status(200).json({
                inStock: true,
                userQuantity,
                availableStock: product.quantity,
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};



//add to cart
const addCart = async (req, res) => {

    const { productId, name, price, quantity, imageUrl } = req.body;
    const userId = req.session.user ? req.session.user : null;
    // console.log("productId ", productId)

    try {

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const imageUrl = product.image[0];

        let cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            cart = new Cart({
                userId: userId,
                items: [],
            });
        }


        const existingItemIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
        );
        let currentCartQuantity = 0;

        if (existingItemIndex > -1) {
            currentCartQuantity = cart.items[existingItemIndex].quantity;
        }

        const totalRequestedQuantity = currentCartQuantity + quantity;


        if (totalRequestedQuantity > product.quantity) {
            return res.status(400).json({
                message: `Only ${product.stock} units are available in stock. You currently have ${currentCartQuantity} in your cart.`,
            });
        }

        if (totalRequestedQuantity > 5) {
            return res.status(400).json({
                message: `You can only add up to 5 units of this product. You currently have ${totalRequestedQuantity} in your cart.`,
            });
        }

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity = totalRequestedQuantity;
        } else {
            cart.items.push({
                productId,
                productName: name,
                price,
                quantity,
                // imageUrl
            });
        }

        await cart.save();

        await Wishlist.updateOne(
            {userId:userId},
            {$pull:{products:{productId:productId}}}
        )


        res.status(200).json({ message: "Product added to cart successfully" });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};




const updateQuantity = (req, res) => {
    const { productId, quantity, productTotal, cartTotal } = req.body;
    // console.log("quantity:",quantity)

    Cart.updateOne(
        { "items.productId": productId },
        {
            $set: {
                "items.$.quantity": quantity,
                "items.$.price": productTotal,
                "totalPrice": cartTotal
            }
        }
    )
        .then(() => res.json({ message: 'Cart updated successfully' }))
        .catch(error => res.status(500).json({ error: 'Failed to update cart', details: error }));
};



const deleteCart = async (req, res) => {
    const productId = req.params.id;
    const userId = req.session.user;
    // console.log(userId);

    try {

        if (!userId) {
            res.redirect("/login")
        }
        let cart = await Cart.findOne({ userId: userId });
        const productIndex = cart.items.findIndex(product => product.productId == productId)
        cart.items.splice(productIndex, 1)
        cart.totalPrice = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

        await cart.save()
        res.status(200).json({ totalPrice: cart.totalPrice })
    } catch (error) {
        console.error("Error in remove products from cart", error)
        res.status(500).json({ message: "internal server error" })

    }


};


const filterProducts = async (req, res) => {
    try {
        const { categories, minPrice, maxPrice, sort } = req.query;
        // console.log('categories: ', categories);
        // console.log("sort",sort)

        let filter = {};

        if (categories && categories.length > 0) {
            filter.category = { $in: categories };
        }

        if (minPrice && maxPrice) {
            filter.salesPrice = { $gte: Number(minPrice), $lte: Number(maxPrice) };
        }

        let sortOptions = {}
        if (sort === 'nameAsc') {
            sortOptions.name = 1;
        } else if (sort === 'nameDesc') {
            sortOptions.name = -1;
        } else if (sort === 'priceAsc') {
            sortOptions.salesPrice = 1;
        } else if (sort === 'priceDesc') {
            sortOptions.salesPrice = -1;
        }

        const products = await Product.find(filter).sort(sortOptions)
            .populate('category', 'name')
            .exec();

        res.json({ products });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Server error" });
    }
};


const searchProducts = async (req, res) => {
    const query = req.query.query;

    try {
        // Use MongoDB's full-text search or regex to find matching products
        const products = await Product.find({
            name: { $regex: query, $options: 'i' } // Case-insensitive search
        });

        res.json({ products });
    } catch (error) {
        console.error('Error during search:', error);
        res.status(500).json({ message: 'Error during search', error });
    }
};


const loadCheckout = async (req, res) => {
    if (req.session.user) {
        try {
            const userId = req.session.user
            const address = await Address.find({ userId: userId })
            const cart = await Cart.findOne({ userId: userId })
            const coupon = await Coupon.find({isActive:true})
            


            const shippinFee = 40;
            let grandTotal = 0
            grandTotal = shippinFee + Number(cart.totalPrice);

            // console.log(cart.totalPrice);
            // console.log('cart toatal : ', cart.items.length);

            res.render("user/checkout", { address, cart, shippinFee, grandTotal , coupon })
        } catch (error) {
            console.error("Error fetching checkout", error)
            res.status(500).json({ message: "Internal server error" })
        }
    } else {
        res.redirect("/login")
    }
}



const loadOrderConfirm = async (req, res) => {
    res.render("user/orderConfirm")
}



const placeOrder = async (req, res) => {
    const { addressId, paymentMethod, discount } = req.body;
    const userId = req.session.user;
    // console.log("addressId", addressId)
    // console.log("paymentMethod", paymentMethod)
    // console.log("userId", userId);


    try {
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.json({ success: false, message: "Cart is empty." });
        }

        const orderAmount=cart.totalPrice
        console.log("orderAmount",orderAmount)
        console.log("paymentMethod",paymentMethod)

        if(orderAmount>20000 && paymentMethod === 'cod'){
            return res.json({success: false, message:"Total amount should lessthan 20000/- for Cash On Delivery"})
        }
        const address = await Address.findOne({ _id: addressId, userId });
        if (!address) {
            return res.json({ success: false, message: "Address not found." });
        }



        const order = new Order({
            userId,
            products: cart.items.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.price

            })),
            totalAmount: cart.totalPrice,
            discount,
            address: {
                firstName: address.firstName,
                lastName: address.lastName,
                streetAddress: address.streetAddress,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode
            },
            paymentMethod,
            
            orderStatus: 'Processing'
        });

        await order.save();

        // Decrease the product quantity in the database
        const productUpdates = cart.items.map(async (item) => {
            const product = await Product.findById(item.productId._id);
            if (product) {
                if (product.quantity >= item.quantity) {
                    product.quantity -= item.quantity;
                    await product.save();
                } else {
                    throw new Error(`Insufficient stock for product: ${product.name}`);
                }
            }
        });

        cart.items = [];
        cart.totalPrice = 0;
        await cart.save();

        res.json({ success: true, orderId: order._id });

    } catch (error) {
        console.error("Error placing order", error)
    }
}



const trackOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const order = await Order.findById(userId).populate('items.product').populate(cartId);

        if (order) {
            res.render('user/trackOrder', { order });
        } else {
            res.render('user/trackOrder', { error: 'No order found.' });
        }
    } catch (error) {
        console.error("Error fetching order:", error);
        res.render('user/trackOrder', { error: 'An error occurred while tracking the order.' });
    }
};



const getOrderHistory = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.session.user }).populate('products.productId').sort({ orderDate: -1 })

        res.render('user/orderDetails', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Error fetching order history');
    }
};


const orderDetails = async (req, res) => {

    try {
        const order = await Order.findById(req.params.id).populate('products.productId')
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ error: 'Server error' });
    }
}


const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id
        // console.log("order id",orderId);

        const order = await Order.findById(orderId)

        if (!order) return res.status(404).json({ message: "order not found" })

        order.orderStatus = "Cancelled"
        order.save()

        const orderItems = order.products;
        // console.log("orderItems",orderItems)

        for (const item of orderItems) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.quantity += item.quantity; // Adjust stock
                await product.save();
            }
        }

        // Handle payment and refund logic
        if (order.paymentMethod === "Razorpay") {
            const wallet = await Wallet.findOne({ userId: order.userId });
            console.log("wallet", wallet)
            if (!wallet) {
                // If the wallet doesn't exist, create a new wallet for the user
                const newWallet = new Wallet({
                    userId: order.userId,
                    balance: order.totalAmount,
                    transactions: [
                        {
                            transactionId: new mongoose.Types.ObjectId().toString(),
                            type: "credit",
                            amount: order.totalAmount,
                        },
                    ],
                });
                await newWallet.save();
            } else {
                // Update existing wallet
                wallet.balance += order.totalAmount;
                wallet.transactions.push({
                    transactionId: new mongoose.Types.ObjectId().toString(),
                    type: "credit",
                    amount: order.totalAmount,
                });
                await wallet.save();
            }
        }

        res.status(200).json({ message: "order cancelled sucessfully" })

    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ error: 'Server error' });
    }
}


const createOrder = async (req, res) => {
    const { amount } = req.body;
    const options = {
        amount: amount * 100, // Razorpay expects amount in paisa (1 INR = 100 paisa)
        currency: "INR",
        receipt: `receipt_${Date.now()}`, // Unique receipt ID for this order
    };
    try {
        const order = await razorpayInstance.orders.create(options);
        res.json({ success: true, order });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ success: false, error: "Failed to create Razorpay order." });
    }
};


const loadWishlist = async (req, res) => {
    try {
        const userId = req.session.user
        // console.log("userId hahahah",userId)
        if (!userId) {
            return res.redirect("/login")
        }
        const wishlist = await Wishlist.findOne({ userId: userId }).populate("products.productId")
        const products = wishlist ? wishlist.products.map(item => item.productId) : [];
        res.render("user/wishlist", { products })
    } catch (error) {
        console.log("error adding wishlist", error)
    }

}


const addWishlist = async (req, res) => {
    const userId = req.session.user
    const { productId } = req.body
    // console.log("userId ",userId)
    // console.log("req.body",req.body)

    if (!userId) {
        return res.status(401).json({ success: false, message: "User not logged in." });
    }

    try {

        const product = await Product.findById(productId);
        console.log("product kitti", product)
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }


        let wishlist = await Wishlist.findOne({ userId: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId: userId, products: [] });
        }
        if (wishlist.products.includes(productId)) {
            return res.status(404).json({ success: false, message: "product already in wishlist." });
        }
        wishlist.products.push({ productId })


        await wishlist.save();
        res.json({ success: true, message: "Product added to wishlist." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};


const deleteWishlist = async (req, res) => {
    const productId = req.params.id;
    const userId = req.session.user;


    try {
        if (!userId) {
            return res.redirect("/login");
        }


        await Wishlist.updateOne(
            { userId },
            { $pull: { products: { productId: productId } } }
        );

        res.status(200).json({ success: true, message: "Product removed from wishlist" });
    } catch (error) {
        console.error("Error removing product from wishlist:", error);
        res.status(500).json({ success: false, message: "Failed to remove product from wishlist" });
    }
};


const applyCoupon = async (req, res) => {
    const { couponCode, cartTotalPrice } = req.body;


    try {
        // Find the coupon by code
        const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

        if (!coupon) {
            return res.json({ success: false, message: 'Invalid or expired coupon code.' });
        }

        // Check the minimum purchase amount
        if (cartTotalPrice < coupon.minPurchase) {
            return res.json({ success: false, message: `Minimum purchase amount of ₹${coupon.minPurchase} is required to apply this coupon.` })
        }

        // Check if the coupon is expired
        const currentDate = new Date();
        if (currentDate > coupon.expiryDate) {
            return res.json({ success: false, message: 'Coupon code has expired.' });
        }

        // Check if the coupon has been used up
        if (coupon.usedCount >= coupon.maxUses) {
            return res.json({ success: false, message: 'Coupon code usage limit reached.' });
        }


        // Apply discount
        const discount = coupon.discount;
        res.json({ success: true, discount: discount });

        coupon.usedCount += 1
        await coupon.save()
    } catch (error) {
        console.error("Error applying coupon:", error);
        res.status(500).json({ success: false, message: 'An error occurred while applying the coupon.' });
    }
};







const loadWallet = async (req, res) => {
    try {
        const userId = req.session.user
        if (!userId) {
            res.redirect("/login")
        }
        const wallet = await Wallet.findOne({ userId: userId })

        res.render("user/wallet", { wallet })
    } catch (error) {
        console.error(error)
    }
}


const returnOrder = async (req, res) => {
    const { orderId, reason } = req.body;

    try {
        // Find the order and update return status
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).send("Order not found.");
        //   console.log("order",order)

        if (order.returnRequest && order.returnRequest.reason) {
            return res.status(400).json({ message: 'Return request already submitted for this order.' });
        }


        // Add return request to the order
        order.returnRequest.reason = reason
        order.returnRequest.status = "Pending"
        order.hasReturnRequest = true
        await order.save();
        res.status(200).json({ message: "Return request submitted" })
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error.");
    }
};


const saveFailedOrder = async (req, res) => {
    try {
        const { addressId, paymentMethod, paymentStatus, razorpayOrderId, paymentError } = req.body;
        const userId = req.session.user
        // console.log("userId hahaha",userId)
        // console.log("reqbody ahahahah",req.body)
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const address = await Address.findOne({ _id: addressId, userId });
        // console.log("cart hahaha",cart)

        const newOrder = new Order({
            userId,
            address: {
                firstName: address.firstName,
                lastName: address.lastName,
                streetAddress: address.streetAddress,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode
            },
            paymentMethod,
            paymentStatus: "Failed",
            orderStatus: "Payment Failed",
            retryable: true,
            razorpayOrderId,
            paymentError,
            products: cart.items.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: cart.totalPrice,
            createdAt: new Date(),
        });

        await newOrder.save();

        res.json({ success: true });
    } catch (err) {
        console.error("Error saving failed order:", err);
        res.status(500).json({ success: false, message: "Failed to save the order." });
    }
};


const retryPayment = async (req, res) => {
    const { orderId } = req.body;

    try {
        // Fetch the order details
        const order = await Order.findById(orderId);
        if (!order || order.orderStatus !== "Payment Failed") {
            return res.status(400).json({ success: false, message: "Invalid order" });
        }

        // Create a new Razorpay order
        const razorpayOrder = await razorpayInstance.orders.create({
            amount: order.totalAmount * 100, // Amount in paise
            currency: "INR",
            receipt: `order_${orderId}`,
        });

        res.json({
            success: true,
            keyId: process.env.RAZORPAY_KEY_ID,
            amount: order.totalAmount * 100,
            razorpayOrderId: razorpayOrder.id,
            orderId: order._id,
            user: {
                name: order.userName,
                email: order.userEmail,
                contact: order.userContact,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


const verifyPayment = async (req, res) => {
    const { orderId, paymentId, razorpayOrderId, signature } = req.body;

    try {
        // Verify the signature (optional but recommended)
        const crypto = require("crypto");
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpayOrderId}|${paymentId}`);
        const generatedSignature = hmac.digest("hex");

        if (generatedSignature !== signature) {
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }

        // Update the order status in the database
        const order = await Order.findByIdAndUpdate(orderId, {
            paymentId,
            orderStatus: "Processing", // Update the status
        });

        // Clear the user's cart
        if (order && order.userId) {
            await Cart.findOneAndUpdate(
                { userId: order.userId },
                { items: [], totalPrice: 0 }
            );
        }


        res.json({ success: true, message: "Payment captured successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Payment capture failed" });
    }
};

// download Invoice
const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.params.id;
        console.log("orderId qwerty",orderId)

        // Fetch the order by ID and populate the product details
        const order = await Order.findById(orderId).populate('products.productId');
        console.log("order qwerty",order)

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Create a PDF document
        const doc = new PDFDocument();

        // Set headers for PDF file response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);

        // Pipe the PDF to the response (stream the file to the client)
        doc.pipe(res);

        // Add the invoice details to the PDF
        doc.fontSize(20).text('Invoice', { align: 'center' }).moveDown();

        // Order details
        doc.fontSize(14).text(`Order ID: ${order._id}`);
        doc.text(`Date: ${order.orderDate}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.text(`Total Amount: ₹${order.totalAmount}`);
        doc.text(`Discount: ₹${order.discount}`);
        doc.text(`Payment Status: ${order.paymentStatus}`);
        doc.text(`Order Status: ${order.orderStatus}`);
        doc.text(`Delivery Address: ${order.address.firstName} ${order.address.lastName}`);
        doc.text(`${order.address.streetAddress}, ${order.address.city}, ${order.address.state}, ${order.address.postalCode}`);

        // Product details
        doc.moveDown().text('Products:', { underline: true });
        order.products.forEach((item) => {
            doc.text(`- ${item.productId.name} x${item.quantity} - $${item.price * item.quantity}`);
        });

        // Finalize the document and send it
        doc.end();

    } catch (err) {
        console.error('Error generating invoice:', err);
        res.status(500).send('Error generating invoice');
    }
};








module.exports = {
    loadNewUserAuth,
    loadsignup,
    loadlogin,
    loadhomepage,
    loginpage,
    signuppage,
    verifyOtp,
    loadverifyOtp,
    resendOtp,
    loadProductPage,
    loadProductDetails,
    productRating,
    logout,
    loadUserProfile,
    editUser,
    updateUser,
    changePassword,
    userAddress,
    addAddress,
    deleteAddress,
    loadCart,
    check_stock,
    addCart,
    updateQuantity,
    deleteCart,
    filterProducts,
    loadCheckout,
    loadOrderConfirm,
    placeOrder,
    trackOrder,
    getOrderHistory,
    orderDetails,
    cancelOrder,
    editAddress,
    createOrder,
    loadWishlist,
    addWishlist,
    deleteWishlist,
    applyCoupon,
    loadWallet,
    returnOrder,
    searchProducts,
    saveFailedOrder,
    retryPayment,
    verifyPayment,
    downloadInvoice,
 



}