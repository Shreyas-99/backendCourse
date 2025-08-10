import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";

const verifyJwt=asyncHandler(async(req,res,next)=>{
    try {
        // console.log("executed==============1");
        // console.log(req.cookies);
        
        
        const token =req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer ","")
        // console.log("executed==============2");

        if (!token) {
            throw new apiError(401,"Unauthorized request to proceed login first");
            
        }
        // console.log(token);
        
        
        const options={
            httpOnly:true,
            secure:true
        }
        const decodedToken=await jwt.verify(token,process.env.TOKEN_ACCESS_SECRET,options)

        const user=await User.findById(decodedToken._id).select("-password -refreshToken")
        if (!user) {
            throw new apiError(401,"Invalid Access Token unable to fetch the user details");
            
        }
        req.user=user
        
        next()
        
    } catch (error) {
        
            throw new apiError(401,error?.message||"Invalid Access Token",);
    
    }
})
export {verifyJwt}