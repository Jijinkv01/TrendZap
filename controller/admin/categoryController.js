
const Category = require("../../model/categoryModel");




// Add a new category
    const addcategory = async (req,res)=>{
        const {name} = req.body
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Category name is required' });

    }
    try {
       
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }
        const newCategory = new Category({ name });
        await newCategory.save();

        res.status(201).json({ success: true, message: 'Category added successfully.' });

    } catch (error) {
       console.error('Error adding category:', error);
        res.status(500).json({ success: false, message: 'An error occurred' }); 
    }
}


// Update an existing category
const updatecategory = async (req,res)=>{
    const {name} = req.body
    const {id} = req.params
   
    
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    try {
        const updatedName =await Category.findByIdAndUpdate(id,{name:name.trim()},{new:true});

        if (!updatedName) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        await updatedName.save();

        res.status(200).json({ success: true, message: 'Category updated successfully' });

    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ success: false, message: 'An error occurred' }); 
    }
}



// Remove an existing category
const deleteCategory = async (req,res)=>{
    const {id} = req.params

    try {
        const deletedCategory = await Category.findByIdAndDelete(id);

        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: 'Category not found.' });
        }

        res.json({ success: true, message: 'Category deleted successfully.' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, message: 'Failed to delete category.' });
    }
};


// disable and enable category
const blockCategory = async (req,res)=>{
    const {categoryId,blockStatus} = req.body
   
    try {
        

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        } 
        category.isBlocked = blockStatus
        await category.save()
        res.status(200).json({ message: "Category status updated successfully" });

    } catch (error) {
        console.error("Error updating category status:", error);
        res.status(500).json({ message: "An error occurred", error }); 
    
    }
}
    











module.exports={
    
    addcategory,
    updatecategory,
    deleteCategory,
    blockCategory
    
   
}
