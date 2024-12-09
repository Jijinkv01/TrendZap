
const User = require("../model/userModel")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const Category = require("../model/categoryModel")
const Product = require("../model/productModel")
const Order = require("../model/orderModel")
const Coupon = require("../model/couponModal")
const Wallet = require("../model/wallet")
const Offer = require("../model/offerModel")
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { generateExcelStream, generatePDFStream } = require("../config/generateReport")



const pageerror = async (req, res) => {
    res.render("admin/error")
}


const loadlogin = (req, res) => {

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.render("admin/login")
}


const login = async (req, res) => {
    try {

        const { email, password } = req.body
        const admin = await User.findOne({ email, isAdmin: true })
        if (!admin) {
            return res.render("admin/login", { errorMessage: "email or password is incorrect" })
        }
        const passwordMatch = await bcrypt.compare(password, admin.password)
        if (!passwordMatch) {
            return res.render("admin/login", { errorMessage: "email or password is incorrect" })
        }
        req.session.admin = true
        return res.redirect("/admin/dashboard")

    } catch (error) {
        console.log("login error", error)
        return res.render("admin/login", { errorMessage: "an error occered. Please try again" })
    }

}


const loadusermanagement = async (req, res) => {
    if (req.session.admin) {
        try {
            const users = await User.find().sort({ _id: -1 })
            res.render("admin/usermanagement", { users })
        } catch (error) {
            console.error("error fetching users", error)
            res.status(500).send("Internal server error")
        }
    } else {
        res.redirect("/admin/login")
    }

}


const loaddashboard = async (req, res) => {
    if (req.session.admin) {
        try {
            res.render("admin/dashboard")
        } catch (error) {
            res.redirect("/admin/pageerror")
        }
    } else {
        res.redirect("/admin/login")
    }
}


const logout = async (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.log("Error destroying session", err);
                res.redirect("/admin/pageerror")

            }

            res.redirect("/admin/login")
        })
    } catch (error) {
        console.log("unexpected error during logout")
        res.redirect("/admin/pageerror")
    }
}


const loadcategory = async (req, res) => {
    if (req.session.admin) {
        try {
            const categories = await Category.find().sort({ _id: -1 })
            res.render("admin/category", { categories })
        } catch (error) {
            console.error("error fetching category", error)
            res.status(500).send("Internal server error")
        }
    } else {
        res.redirect("/admin/login")
    }

}


const loadProduct = async (req, res) => {
    if (req.session.admin) {
        try {
            const page = parseInt(req.query.page) || 1; // Default to page 1
            const limit = parseInt(req.query.limit) || 5; // Default to 10 items per page
            const skip = (page- 1) * limit;

            // Fetch products with pagination
            const products = await Product.find({ isBlocked: { $ne: true } })
                .sort({ _id: -1 })
                .skip(skip)
                .limit(limit)
                .populate('category');

                

            const totalProducts = await Product.countDocuments({ isBlocked: { $ne: true } });
            const totalPages = Math.ceil(totalProducts / limit);
            const startIndex = (page -1) * limit


            const pagination = Array.from({ length: totalPages }, (_, i) => ({
                page: i + 1,
                active: i + 1 === page,
            }));

            const BlockedProducts = await Product.find({ isBlocked: true });
            const categories = await Category.find({ isBlocked: false });

            res.render("admin/product", {
                products,
                categories,
                BlockedProducts,
                pagination,
                startIndex
            });
        } catch (error) {
            console.error("Error fetching products", error);
            res.status(500).send("Internal server error");
        }
    } else {
        res.redirect("/admin/login");
    }
};


const loadOrderManagement = async (req, res) => {
    if (req.session.admin) {
        try {
            const orders = await Order.find().populate("address")
            orders.forEach(order => {
                order.orderId = order._id.toString().slice(-5);
            });

            res.render("admin/orderManagement", { orders })
        } catch (error) {
            res.redirect("/admin/pageerror")
        }
    } else {
        res.redirect("/admin/login")
    }
}



const loadCoupon = async (req, res) => {
    if (req.session.admin) {
        try {
            const coupon = await Coupon.find()
            res.render("admin/couponManagement", { coupon })
        } catch (error) {
            console.error(error)
        }
    }

    else {
        res.redirect("/admin/login")
    }
}


const addCoupon = async (req, res) => {
    const { code, discount, minPurchase, expiryDate, maxUses } = req.body;


    try {
        if (!code || !discount || !expiryDate || !maxUses) {
            return res.status(400).json({ error: 'All required fields must be filled!' });
        }

        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ error: 'A coupon with this code already exists!' });
        }

        const expiry = new Date(expiryDate);
        if (expiry <= new Date()) {
            return res.status(400).json({ error: 'Expiry date must be a future date!' });
        }

        const newCoupon = new Coupon({
            code,
            discount,
            minPurchase,
            expiryDate,
            maxUses,
        });

        await newCoupon.save();
        res.status(200).json({ message: 'Coupon added successfully!', coupon: newCoupon });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add coupon', details: error.message });
    }
};



const removeCoupon = async (req, res) => {
    try {
        const couponId = req.params.id
        //    console.log("couponId",couponId)
        const deleteCoupon = await Coupon.findByIdAndDelete(couponId)
        if (!deleteCoupon) {
            return res.status(404).json({ error: 'Coupon not found!' })
        }
        res.status(200).json({ message: 'Coupon deleted successfully!' });

    } catch (error) {
        res.status(500).json({ error: 'Failed to delete coupon', details: error.message });
    }
}



const getReturnRequest = async (req, res) => {
    const orderId = req.params.id

    try {
        const order = await Order.findById(orderId)

        if (!order || !order.returnRequest) {
            return res.status(404).json({ message: 'Return request not found.' });
        }
        res.json({
            reason: order.returnRequest.reason,
            status: order.returnRequest.status,
        });
    } catch (error) {
        console.error('Error fetching return request:', error);
        res.status(500).json({ message: 'Failed to fetch return request.' });
    }
}



const updateReturnRequestStatus = async (req, res) => {
    const { orderId, status } = req.body
    // console.log("reqbody", req.body)

    try {
        const order = await Order.findById(orderId).populate('products.productId');
        if (!order || !order.returnRequest) {
            return res.status(404).json({ message: 'Return request not found.' });
        }
        order.returnRequest.status = status;
        if (status === 'Accepted' || status === 'Rejected') {
            order.hasReturnRequest = false;
        }
        await order.save()
        if (status === 'Accepted') {
            for (const item of order.products) {
                const product = await Product.findById(item.productId)
                if (product) {
                    product.quantity += item.quantity; // Adjust field name if 'stock' differs
                    await product.save();
                }
            }
        }

        const refundAmount = order.products.reduce((sum, item) => {
            return sum + item.price * item.quantity;
        }, 0);

        const wallet = await Wallet.findOne({ userId: order.userId });
        if (wallet) {
            wallet.balance += refundAmount;
            wallet.transactions.push({
                transactionId: `REFUND-${orderId}-${Date.now()}`,
                type: 'credit',
                amount: refundAmount,
            });
            await wallet.save();
        } else {
            // Create a new wallet if none exists
            const newWallet = new Wallet({
                userId: order.userId,
                balance: refundAmount,
                transactions: [
                    {
                        transactionId: `REFUND-${orderId}-${Date.now()}`,
                        type: 'credit',
                        amount: refundAmount,
                    },
                ],
            });
            await newWallet.save();
        }


        res.json({ message: `Return request ${status.toLowerCase()} successfully.` });
    } catch (error) {
        console.error('Error updating return request status:', error);
        res.status(500).json({ message: 'Failed to update return request status.' });
    }
}




const loadSalesReport = async (req, res) => {
    try {
        const { filter, startDate, endDate, page = 1, limit = 5 } = req.query;

        const filterQuery = {};

        if (filter === 'daily') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            filterQuery.orderDate = { $gte: startOfDay };
        } else if (filter === 'weekly') {
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            filterQuery.orderDate = { $gte: startOfWeek, $lte: endOfWeek };
        } else if (filter === 'monthly') {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            filterQuery.orderDate = { $gte: startOfMonth };
        } else if (filter === 'custom' && startDate && endDate) {
            filterQuery.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const skip = (page - 1) * limit;
        const totalOrders = await Order.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalOrders / limit);

        const salesData = await Order.aggregate([
            { $match: filterQuery },
            {
                $group: {
                    _id: null,
                    totalSalesCount: { $sum: 1 },
                    totalSalesAmount: { $sum: "$totalAmount" },
                    totalDiscount: { $sum: "$discount" }
                }
            }
        ]);

        const summary = salesData[0] || {
            totalSalesCount: 0,
            totalSalesAmount: 0,
            totalDiscount: 0
        };

        const salesReport = await Order.find(filterQuery)
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('userId', 'firstName lastName')
            .exec();

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({
                summary,
                salesReport,
                pagination: {
                    totalOrders,
                    totalPages,
                    currentPage: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        }

        res.render('admin/salesReport', {
            summary,
            salesReport,
            pagination: {
                totalOrders,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};



const loadOfferManagement = async (req, res) => {
    if (req.session.admin) {
        try {
            const offer = await Offer.find()
            res.render("admin/offerManagement", { offer })
        } catch (error) {
            console.error(error)
        }
    }

    else {
        res.redirect("/admin/login")
    }
}



const addOffer = async (req, res) => {
    const { title, discount, startDate, endDate } = req.body
    try {
        if (!title || !discount || !startDate || !endDate) {
            return res.status(400).json({ error: 'All required fields must be filled!' });
        }
        const parsedEndDate = new Date(endDate);
        if (parsedEndDate <= new Date()) {
            return res.status(400).json({ error: 'endDate date must be a future date!' });
        }
        const newOffer = new Offer({
            title,
            discount,
            startDate,
            endDate: parsedEndDate,
        })
        await newOffer.save()
        res.status(200).json({ message: 'Offer added successfully!', offer: newOffer });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add offer', details: error.message });
    }
}



const deleteOffer = async (req, res) => {
    try {
        const offerId = req.params.id
        console.log("offerId", req.params.id)
        const deleteOffer = await Offer.findByIdAndDelete(offerId)
        if (!deleteOffer) {
            return res.status(404).json({ error: 'Offer not found!' })
        }
        res.status(200).json({ message: 'Offer deleted successfully!' });

    } catch (error) {
        res.status(500).json({ error: 'Failed to delete Offer', details: error.message });
    }
}




const downloadExcel = async (req, res) => {
    try {
        const orders = await Order.find().populate('products.productId').populate('userId');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Orders Report');

        // Add Header Row
        worksheet.addRow([
            'Sl No',
            'Order ID',
            'Date',
            'User',
            'Payment Method',
            'Payment Status',
            'Total Amount',
            'Discount',
            'Order Status',
            'Products',
            'Address',
        ]);

        // Add Data Rows
        orders.forEach((order, index) => {
            const products = order.products
                .map(
                    (product) =>
                        `${product.productId?.name || 'Unknown'} (Qty: ${product.quantity
                        }, ₹${product.price})`
                )
                .join('\n');
            const address = `${order.address.firstName} ${order.address.lastName}, ${order.address.streetAddress}, ${order.address.city}, ${order.address.state} - ${order.address.postalCode}`;

            worksheet.addRow([
                index + 1,
                order._id,
                new Date(order.orderDate).toLocaleDateString(),
                order.userId?.name || 'Unknown',
                order.paymentMethod,
                order.paymentStatus,
                `₹${order.totalAmount}`,
                `₹${order.discount}`,
                order.orderStatus,
                products,
                address,
            ]);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="OrdersReport.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating Excel');
    }
};





const downloadPdf = async (req, res) => {
    try {
        const orders = await Order.find().populate('products.productId').populate('userId');

        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="OrdersReport.pdf"');
        doc.pipe(res);

        // Add PDF content
        doc.fontSize(20).text('Orders Report', { align: 'center' });
        doc.moveDown();

        orders.forEach((order, index) => {
            doc.fontSize(12).text(
                `${index + 1}. Order ID: ${order._id}
                Date: ${new Date(order.orderDate).toLocaleDateString()}
                User: ${order.userId?.name || 'Unknown'}
                Payment: ${order.paymentMethod} (${order.paymentStatus})
                Total: ₹${order.totalAmount}, Discount: ₹${order.discount}
                Status: ${order.orderStatus}
                Address: ${order.address.firstName} ${order.address.lastName}, ${order.address.streetAddress}, ${order.address.city}, ${order.address.state} - ${order.address.postalCode}
                `
            );
            doc.moveDown();
            doc.text('Products:');
            order.products.forEach((product, pIndex) => {
                doc.text(
                    `   ${pIndex + 1}. ${product.productId?.name || 'Unknown'} - Quantity: ${product.quantity}, Price: ₹${product.price}`
                );
            });
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating PDF');
    }
};



const bestSellingData = async (req, res) => {
    try {
      const { type } = req.query; // 'yearly' or 'monthly'
      const currentDate = new Date();
      let startDate;

      console.log("req.query hahah",req.query)
      console.log("currentDate hahaha",currentDate)
  
      // Set date range based on type
      if (type === 'yearly') {
        startDate = new Date(currentDate.getFullYear(), 0, 1);
      } else if (type === 'monthly') {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      } else {
        return res.status(400).json({ error: 'Invalid type' });
      }
  
      // Aggregate Best-Selling Products
      const products = await Order.aggregate([
        { $match: { orderDate: { $gte: startDate, $lte: currentDate } } },
        { $unwind: '$products' },
        {
          $lookup: {
            from: 'products',
            localField: 'products.productId',
            foreignField: '_id',
            as: 'productDetails',
          },
        },
        { $unwind: '$productDetails' },
        {
          $group: {
            _id: '$products.productId',
            name: { $first: '$productDetails.name' },
            totalQuantity: { $sum: '$products.quantity' },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
      ]);
  
      // Aggregate Best-Selling Categories
      const categories = await Order.aggregate([
        { $match: { orderDate: { $gte: startDate, $lte: currentDate } } },
        { $unwind: '$products' },
        {
          $lookup: {
            from: 'products',
            localField: 'products.productId',
            foreignField: '_id',
            as: 'productDetails',
          },
        },
        { $unwind: '$productDetails' },
        {
          $group: {
            _id: '$productDetails.category',
            totalQuantity: { $sum: '$products.quantity' },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryDetails',
          },
        },
        { $unwind: '$categoryDetails' },
        {
          $project: {
            name: '$categoryDetails.name',
            totalQuantity: 1,
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
      ]);
  
      // Aggregate Best-Selling Brands
      
      const brands = await Order.aggregate([
        // Step 1: Match to filter orders within a specific date range (optional)
        { 
          $match: { 
            orderDate: { $gte: new Date('2024-01-01'), $lte: new Date() } 
          } 
        },
      
        // Step 2: Unwind the products array to get each product separately
        { $unwind: '$products' },
      
        // Step 3: Join with the Product collection to fetch brand details
        {
          $lookup: {
            from: 'products', // Collection name for Product
            localField: 'products.productId',
            foreignField: '_id',
            as: 'productDetails',
          },
        },
      
        // Step 4: Unwind productDetails array to access brand data
        { $unwind: '$productDetails' },
      
        // Step 5: Group by brand and calculate the total quantity sold
        {
          $group: {
            _id: '$productDetails.brand', // Group by brand
            totalQuantity: { $sum: '$products.quantity' }, // Sum the quantity of products sold
          },
        },
      
        // Step 6: Sort by totalQuantity in descending order
        { $sort: { totalQuantity: -1 } },
      
        // Step 7: Limit to top 10 brands
        { $limit: 10 },
      
        // Step 8: Project the final result with brand name and totalQuantity
        {
          $project: {
            brand: '$_id', // Brand name
            totalQuantity: 1, // Total quantity sold
            _id: 0, // Exclude the _id field
          },
        },
      ]);




      console.log("products",products)
      console.log("categories",categories)
      console.log("brands",brands)
  
      res.json({ products, categories, brands });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


module.exports = {
    loadlogin,
    loaddashboard,
    loadusermanagement,
    login,
    pageerror,
    logout,
    loadcategory,
    loadProduct,
    loadOrderManagement,
    loadCoupon,
    addCoupon,
    removeCoupon,
    getReturnRequest,
    updateReturnRequestStatus,
    loadSalesReport,
    loadOfferManagement,
    addOffer,
    deleteOffer,
    downloadExcel,
    downloadPdf,
    bestSellingData


}
