const express = require("express")
const app = express()
const path = require("path")
const hbs = require("hbs")
const session = require("express-session")
const nocache = require("nocache")
const bodyParser = require("body-parser")
const req = require("express/lib/request")
const userRoutes = require("./routes/user")
const adminRoutes = require("./routes/admin")
const connectDB = require("./db/connectDB")
const env = require("dotenv").config()
const passport = require("./db/passport")
const MongoStore = require('connect-mongo');
const moment = require('moment');
const cors = require("cors")




app.use(express.json());
app.use(express.urlencoded({ extended: true }))



// hbs helpers
hbs.registerPartials(path.join(__dirname, "views/admin/partials"))
hbs.registerPartials(path.join(__dirname, "views/user/partials"))


hbs.registerHelper("indexPlusOne", function (index) {
    return index + 1
})
hbs.registerHelper('isSelected', function (categoryId, selectedId) {
    // Compare the two IDs and return true if they match
    return categoryId === selectedId;
});

hbs.registerHelper('multiply', function (a, b) {
    return a * b;
});

hbs.registerHelper("formatDate", function (date) {
    return moment(date).format("MMMM D, YYYY"); // Example format: "November 15, 2024"
});

hbs.registerHelper('formatDate', function (date, format) {
    return moment(date).format(format || 'YYYY-MM-DD'); // Default format: "YYYY-MM-DD"
})

// Helper for conditional status class
hbs.registerHelper('statusClass', function (orderStatus) {
    switch (orderStatus) {
        case 'Processing':
            return 'text-info';
        case 'Shipped':
            return 'text-primary';
        case 'Delivered':
            return 'text-success';
        case 'Cancelled':
            return 'text-danger';
        case 'Payment Failed':
            return 'text-warning';
        default:
            return 'text-muted';
    }
});

// Helper for conditional comparison
hbs.registerHelper('ifEquals', function (arg1, arg2, options) {
    return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
});


hbs.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});


hbs.registerHelper('ifEquals', function (arg1, arg2, options) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});


hbs.registerHelper('range', (start, end) => {
    let result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
});



hbs.registerHelper('gt', (a, b) => a > b);
hbs.registerHelper('eq', (a, b) => a === b);
hbs.registerHelper('lt', (a, b) => a < b);
hbs.registerHelper('add', (a, b) => a + b);
hbs.registerHelper('subtract', (a, b) => a - b);


app.set("view engine", "hbs")
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },

}))


app.use(nocache())
app.use(passport.initialize())
app.use(passport.session())


app.use("/", userRoutes)
app.use("/admin", adminRoutes)


connectDB()


app.listen(process.env.PORT, () => {
    console.log("server is running")
})





// jijin jijin jijin jijin 

