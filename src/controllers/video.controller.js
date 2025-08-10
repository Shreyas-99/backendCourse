import { Video } from "../models/video.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
 




const getAllVideos=asyncHandler(async(req,res)=>{
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
  const videos=Video.aggregatePaginate()
})


const publishAVideo=asyncHandler(async(req,res)=>{

        //make sure you run verifyJwt so file.users added to the req
 
    const {title,description}=req.body

     if ([title,description].some((item)=>{
        return item?.trim()===""
     })) {
        throw new apiError(400,"title and description are required")
     }

     const videoFileLocalPath=req.files?.videoFile[0]?.path
     console.log(req.files);
     
     const thumbnailLocalPath=req.files?.thumbnail[0]?.path

    if ([videoFileLocalPath,thumbnailLocalPath].some((item)=>{
        return item?.trim()===""
     })) {
     
        throw new apiError(400,"video file and thumbnail are required")
    }

    const videoFile=await uploadOnCloudinary(videoFileLocalPath);
    if (!videoFile) {
       throw new apiError(400,"video file is required")  
    }
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new apiError(400,"thumbnail is required")  
    }

    const video=await Video.create({
        title,
        description,
        duration: videoFile.duration,
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        owner:req.user._id
    })


    return res
    .status(201)
    .json(
        new apiResponse(200,video,"video uploaded successfully")
    )

  
})




export {
    getAllVideos,
    publishAVideo


}