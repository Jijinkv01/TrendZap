const User = require("../../model/userModel")




const blockuser = async (req,res)=>{
    const {userId, blockStatus} = req.body
     
    try {
        const user =  await User.findById(userId)
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        user.isBlocked = blockStatus
        await user.save()
        
        if (blockStatus && req.session.user === user) {
            req.session.destroy((err) => {
                if (err) {
                    return res.status(500).json({ message: "Error logging out the user" });
                }
            });
        }

        res.status(200).json({ message: "User status updated successfully" });
        
    } catch (error) {
        res.status(500).json({ message: "An error occurred", error }); 
    }
}


module.exports={
    blockuser
}