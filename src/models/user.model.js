import mongoose,{Schema} from "mongoose";
import bycrypt from "bcrypt";
import jwt from "jsonwebtoken"

const userSchema=new Schema(
    {
         userName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
            index: true
        },
        email:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim:true

        },
        fullName:{
            type: String,
            required: true,
            trim: true, 
            index: true
        },
        avatar:{
            type: String, // url from cloudinary
            required: true,
        },
        coverImage:{
            type:String,
        },
        watchHistory:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type: String,
            required:[true, "Password is required"],
        },
        refreshToken:{
            type: String,
        },
        
    },
    {
        timestamps:true
    }
)
 userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next();
    }
    else{
        this.password=await bycrypt.hash(this.password,10)
    }
 })
 userSchema.methods.ispasswordCorrect= async function(password){
    return await bycrypt.compare(password,this.password)
 }
userSchema.methods.generateAccessToken=function(){
return jwt.sign(
    {
        _id:this._id,
        email:this.email,
        fullName:this.fullName,
        userName:this.userName
    },
    process.env.TOKEN_ACCESS_SECRET,
    {
        expiresIn:process.env.TOKEN_ACCESS_EXPIRY
    }
)

}
userSchema.methods.generateRefreshToken=function(){
return jwt.sign(
    {
        _id:this._id,
        
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)

}

export const User=mongoose.model('User',userSchema)
 