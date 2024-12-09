const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Save files with unique names
  },
});

const upload = multer({ storage: storage }).array('productImages', 3); // Limit to 3 images

const addProduct = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error uploading images' });
    }
    
    try {
      const { name, brand, category, description, regularPrice, salesPrice, quantity, color } = req.body;
      const imagePaths = req.files.map((file) => "uploads/" + file.filename);
      
      const newProduct = new Product({
        name,
        brand,
        category,
        description,
        regularPrice,
        salesPrice,
        quantity,
        color,
        image: imagePaths,
      });

      await newProduct.save();
      res.json({ success: true, message: 'Product added successfully' });
    } catch (error) {
      console.error("Error adding product:", error);
      res.status(500).json({ success: false, message: 'Error adding product' });
    }
  });
};


  module.exports = upload