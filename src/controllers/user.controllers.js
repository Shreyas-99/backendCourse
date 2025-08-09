import { json, request, response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { deletefromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import { Subscriber } from "../models/subscribe.model.js";
import { Video } from "../models/video.model.js";

const generateRefreshAndAccessToken=async (userId)=> {
  const user=await User.findById(userId)
    const accessToken=await user.generateAccessToken()
  const refreshToken=await user.generateRefreshToken()

  user.refreshToken=refreshToken
  await user.save({ validBeforeSave:false })

  return {accessToken,refreshToken}
}



const userRegister=asyncHandler(async (req,res)=>{

  const {fullName,email,userName,password}=req.body

  console.log(userName);


  if ([fullName,email,userName,password].some((item)=>{
    return item?.trim()===""
  })) { 
    throw new apiError(400,"all feilds are required")
  }

  if (!email?.includes('@')) {
    throw new apiError(400,"please enter email in a stanard format")
  }

  const userExist=await User.findOne(
    {
      $or:[{userName},{email}]
    }
  )

  if (userExist) {
    throw new apiError(400,"this user already exist")
  }

  // console.log(req.files);
  
  const avatarLocalPath=req.files?.avatar[0]?.path
  const coverImageLocalPath=req.files?.coverImage[0]?.path

  // console.log(avatarLocalPath)

  if (!avatarLocalPath) {
    throw new apiError(400,"avatar image is required")
  }

  const avatar= await uploadOnCloudinary(avatarLocalPath)
  
  const coverImage=await uploadOnCloudinary(coverImageLocalPath)

  
  console.log(avatar);

  if (!avatar) {
    throw new apiError(400,"avatar image is required")
  }

  console.log("-------EXECUTED--------------");


  const newUser= await User.create(
    {
      fullName,
      email,
      password,
      avatar:avatar.url,
      coverImage:coverImage.url||"",
      userName:userName.toLowerCase()
    }
  )
  // console.log(newUser);
  console.log("-------EXECUTED--------------");
  const newUserCreated=await User.findById(newUser._id).select(
    "-password -refreshToken"
  )

  // console.log(newUserCreated);

  if (!newUserCreated) {
    throw new apiError(500,"something went wrong while registering the user")
  }
  res.status(201).json(
    new apiResponse(200,newUserCreated,"user created successfully")
  )
})



const userLogin=asyncHandler(async (req,res)=>{
  console.log(req.body);
  
  const { email , userName, password } = req.body


  if (!(email||userName)) {
     throw new apiError(400,"email or userName is required")
  }
  
    const user=await User.findOne({
    $or:[{email},{userName}]
  })

  
  
  if (!user) {
    throw new apiError(400,"user by this userName or email doesnt exist")
  }

  const ispasswordCorrect=await user.ispasswordCorrect(password)

  if (!ispasswordCorrect) {
    throw new apiError(400,"invaild password")
  }


const {accessToken,refreshToken}=generateRefreshAndAccessToken(user._id)

  const loggedInUser=await User.findById(user._id)
  .select("-password -refreshToken")

  const options={
    httpOnly:true,
    secure:true

  }
  return res.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
  new apiResponse(
    200,
    {
      user:loggedInUser,accessToken,refreshToken
    },
    "User logged in successfully"

  )
)
  

})


const userLogout=asyncHandler(async (req,res)=>{
   const user=req.user


  await User.findByIdAndUpdate(
    user._id,
    {
      $unset: { refreshToken: "" }
    },
    {
      new:true
    }
  )



  const options={
    httpOnly:true,
    secure:true


  }
  res
  .status(200)
  .clearCookie("refreshToken",options)
  .clearCookie("accessToken",options)
  .json(
  new apiResponse(200,{},"user logged out succesfully"))

})


const refreshAcessToken=asyncHandler(async (req,res)=>{
  const refreshTokenFromUserRequest=req.cookies?.refreshToken||req.body?.refreshToken

  if (!refreshTokenFromUserRequest) {
    throw new apiError(400,"unauthorized request")
  }

  try {
    const decodedRefreshToken=jwt.verify(refreshTokenFromUserRequest,process.env.REFRESH_TOKEN_SECRET)

    const user=await User.findById(decodedRefreshToken?._id)

    if (!user) {
      throw new apiError(400,"Invalid RefreshToken")
    }

    if (!decodedRefreshToken===refreshTokenFromUserRequest) {
      throw new apiError(400,"refresh Token is expired")
    }

    const {accessToken,refreshToken:newrefreshToken}=generateRefreshAndAccessToken(user._id)

    const options={
      httpOnly:true,
      secure:true
    }
    res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new apiResponse(200,{accessToken,refreshToken:newrefreshToken},"AccessToken refreshed")
    )

  } catch (error) {
    throw new apiError(400,error?.message||"Invalid Access Token")
  }
})


const changeCurrentPassword=async()=>{
  const {oldPassword,newPassword}=req.body

  if (!(oldPassword&&newPassword)) {
    throw new apiError(400,"new passward and old passwords are required ")
  }

  const user=await User.findById(req.user?.user._id)

  if (!user) {
    throw new apiError(400,"this user doesnt exist")
  }

  const ispasswordCorrect=user.ispasswordCorrect(oldPassword)

  if (!ispasswordCorrect) {
    throw new apiError(400,"password is invalid")
  }
   
  user.password=newPassword
  await user.save({validateBeforeSave:false})


  res
  .status(200)
  .json(
    new apiResponse(200,{},"password changed successfully")
  )

}


const getCurrentUser=asyncHandler(async(req,res)=>{
return res
.status(200)
.json(
  new apiResponse(200,req.user,"User fetched successfully")
)

})


const updateAccontDetails=asyncHandler(async(req,res)=>{
  const {email,fullName}=req.body
  if (!(email||fullName)) {
    throw new apiError(400,"email or fullName cannot be empty")
  }

  const user=await User.findByIdAndUpdate(req.user?._id,
    {
    $set:{
      fullName:fullName,
      email:email
    }
    
  },
  {
    new:true
  }).select("-password -refreshToken")

  return res
  .status(200)
  .json(
    new apiResponse(
      200,user,"Account Details Updated Successfully"
    )
  )
})



const updateUserAvatar=asyncHandler(async (req,res)=>{
  const userFromReq=req.user
  const oldUser=await User.findById(userFromReq._id)

const avatarLocalPath=req.file?.path

if(!avatarLocalPath)
{
  throw new apiError(400,"Avatar Image is required")
}

const avatar=uploadOnCloudinary(avatarLocalPath);
 if (!avatar) {
  throw new apiError(400,"avatar image is required")
 }

 const deleteImage= await deletefromCloudinary(oldUser?.avatar)

 const user=await User.findByIdAndUpdate(oldUser._id,
  {
    $set:{
      avatar:avatar.url
    }
 },
 {
  new:true
})
return res
.status(200)
.json(
  new apiResponse(200,"User avatar updated successfully")
)

})



const UpdateUserCoverImage=asyncHandler(async(req,res)=>{
 const userFromReq=req.user
  const oldUser=await User.findById(userFromReq._id)

const coverImageLocalPath=req.file?.path

if(!coverImageLocalPath)
{
  throw new apiError(400,"Avatar Image is required")
}

const coverImage=uploadOnCloudinary(coverImageLocalPath);
 if (!coverImage) {
  throw new apiError(400,"cover image is required")
 }

 const deleteImage= await deletefromCloudinary(oldUser?.coverImage)

 const user=await User.findByIdAndUpdate(oldUser._id,
  {
    $set:{
      coverImage:coverImage?.url
    }
 },
 {
  new:true
})
return res
.status(200)
.json(
  new apiResponse(200,"User cover image updated successfully")
)
})



const getUserChannelProfile=asyncHandler(async(req,res)=>{
  const {username}=req.params

  if (!username?.trim()) {
    throw new apiError(400,"user name is required")
  }

  const searchedChannelData=await User.aggregate([
  {
    $match:{userName:username?.trim()}
  },
  {
    $lookup:{
    from:"subscribers",
    localField:"_id",
    foreignField:"channel",
    as:"subscribers"
  }, 
  },
  {
    $lookup:{
      form:"subscribers",
      localField:"_id",
      foreignField:"subscriber",
      as:"subscribedTo"
    }
  },
  {
      $addFields:
      {
        subscriberCount:{
          $size:"$subscribers"
        },
        subscribedToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in:[req.user?._id,"$subscribers"]},
            then:true,
            else:false,

            
          }
        }
      }
  },
  {
    $project:{
      userName:1,
      fullName:1,
      coverImage:1,
      avatar:1,
      isSubscribed:1,
      subscribedToCount:1,
      subscriberCount:1,
      email:1 
    }
  }
  ])

  if (!searchedChannelData?.length) {
    throw new apiError(404,"user not found")
  }

  return res
  .status(200)
  .json(
    new apiResponse(200,searchedChannelData[0],"channel fetched successfully")
  )  

})


const getWatcHistory=asyncHandler(async(req,res)=>{

const userWatchHistory=Video.aggregate([
  {
    $match:{_id:req.user?._id}
  },
  {
    $lookup:{
      from:"videos",
      localField:"watchHistory",
      foreignField:"_id",
      as:"watchHistory",
      pipeline:[
        {
          $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
              {
                $project:{
                  userName:1,
                  fullName:1,
                  avatar:1,
                  coverImage:1
                }
              }
            ]
          }
        },
        {
          $addFields:{
            owner:{
              $first:"$owner"
            }
          }
        }
      ]
    }
  }
])

return res
.status(200)
.json(
  new apiResponse(200,userWatchHistory[0].watchHistory,"watch history fetched successfully")
)
})









export {
  userRegister,
  userLogin,
  userLogout,
  refreshAcessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccontDetails,
  updateUserAvatar,
  UpdateUserCoverImage,
  getUserChannelProfile,
  getWatcHistory

} 
