import { User } from  "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}



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


const loginUser =  asyncHandler(async(req, res)=>{

        const {email, password} = req.body
        console.log(email)

        if(!email && !password){
            throw new ApiError(400, "email and password is required")
        }

        const user = await User.findOne({email:email.trim().toLowerCase()});

        
        if(!user){
            throw new ApiError(404,"User does not exist")
        }

        const isPasswordValid= await user.isPasswordCorrect(password)

        if(!isPasswordValid){
            throw new ApiError(401, "invalid user credentials")
        }

        const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

          
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
        
        const options={
            httpOnly: true, 
            secure: true
        }

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user:loggedInUser, accessToken, refreshToken
                }, 
                "User Logged In Successfully"
            )
        )

})


export {registerUser,loginUser}


