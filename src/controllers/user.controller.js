import { User } from  "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const registerUser = asyncHandler( async (req, res) => {

    const {name, email, password} = req.body
    
    if (
        [name, email, password].some((field) => field?.trim() ==="")
    )
    {
        throw new ApiError(400, "All the field are required")
    }
      
    const existedUser = await User.findOne({email:email.trim().toLowerCase()});


    if (existedUser) { 
        throw new ApiError(400, "User with email already exists")
    }

    const user = await User.create({
        name, 
        email,
        password,
        status:"active", 
        avatarUrl:""
    })

    const createdUser = await User.findById(user._id).select( "-password" )    

    if (!createdUser){
        throw new ApiError(500,"something went wrong while regsitering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})


export {registerUser}