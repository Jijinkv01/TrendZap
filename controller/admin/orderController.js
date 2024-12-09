const Order = require("../../model/orderModel")



const changeOrderStatus = async (req,res)=>{
    const {orderId,status} = req.body
   
    try {
       const order = await Order.findByIdAndUpdate(orderId,{orderStatus:status},{new:true})
       if(order){
        res.status(200).json({message:'Order status updated successfully',order})
       } else {
        res.status(404).json({message:"order not found"})
       }
        
    } catch (error) {
        console.error("Error occered when changing order status:", error);
        res.status(500).json({ error: 'Server error' });
    }
}





module.exports = {changeOrderStatus}




