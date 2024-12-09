const Product = require("../../model/productModel")
const Category = require("../../model/categoryModel")
const User = require("../../model/userModel")
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")
const multer = require('multer');
const upload = require("../../config/multer")


// add new product

const addProduct = async (req,res)=>{
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
    
    res.json({ success: true, message: "Product added successfully" });  
  
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ success: false, message: "Error adding product" });
    
  }
}


// edit existing product

const editProduct = async (req,res)=>{
  try {
    const { id } = req.params;
    const { name, brand, category, description, regularPrice, salesPrice, quantity, color } = req.body;
    
   
    const updateFields = {
      name,
      brand,
      category,
      description,
      regularPrice,
      salesPrice,
      quantity,
      color,
    };
    if (req.files.length > 0) {
      const newImages = req.files.map((file) => "uploads/" + file.filename);
      const product = await Product.findById(id);
      updateFields.image = [...product.image, ...newImages];
  }
    await Product.findByIdAndUpdate(id, updateFields);
    res.json({ success: true, message: "Product updated successfully" });

  } catch (error) {

    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Error updating product" });
  }
}


const deleteProductImage = async (req, res) => {
  try {
      const { imageUrl } = req.body;
      const product = await Product.findOne({ image: imageUrl });
      if (product) {
          product.image = product.image.filter((img) => img !== imageUrl);
          await product.save();
          fs.unlinkSync(imageUrl); // Remove the file from the server
          res.json({ success: true, message: "Image deleted successfully" });
      } else {
          res.status(404).json({ success: false, message: "Image not found" });
      }
  } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ success: false, message: "Error deleting image" });
  }
};






// block a product
const blockProduct = async (req,res)=>{
  try {
    const product = await Product.findById(req.params.id);
   
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.isBlocked = true;
    await product.save();
   
    return res.json({ success: true, message: "Product blocked successfully" });

  } catch (error){
    console.error("Error blocking product:", error);
    return res.status(500).json({ success: false, message: "Failed to block product" });
  }
}


// unblock product
const   unBlockProduct = async (req,res)=>{
  try {
    const product = await Product.findById(req.params.id)
    console.log(product)
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.isBlocked = false;
    await product.save();
    return res.json({ success: true, message: "Product restored successfully" });

  } catch (error) {
    console.error("Error restoring product:", error);
    return res.status(500).json({ success: false, message: "Failed to restore product" });
  }
}





module.exports={
    addProduct,
    editProduct,
    blockProduct,
    unBlockProduct,
    deleteProductImage

    
}