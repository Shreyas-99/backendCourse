import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deletefromCloudinary, uploadOnCloudinary, uploadVideoOnCloudinary } from "../utils/cloudinary.js";
import { log } from "console";
 


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
    
    const videoFile=await uploadVideoOnCloudinary(videoFileLocalPath);
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


const getAllVideos=asyncHandler(async(req,res)=>{
    const { page: rawPage = 1,limit: rawLimit = 10, query, sortBy, sortType, userId } = req.query
   const page=parseInt(rawPage,10)
   const limit=parseInt(rawLimit,10)

    
    const sortOrder=(sortType==="asc")?1:-1
    
    const videos= await Video.aggregatePaginate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(String(userId))
            }
        },
        {
            $match:{
                $or:[{title:{$regex:query,$options:"i"}},
                    {description:{$regex:query,$options:"i"} }
                ]
            }
        },
        {
                $sort:{[sortBy]:sortOrder}
        }
        ],
        {page,limit}
    )
            console.log(videos);
            

     return res
     .status(200)
     .json(
        new apiResponse(200,videos,videos.totalDocs>0?"searched videos fetched successfully":"there is no related video")
     )
 
})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new apiError(404,"not found")
    }
    //TODO: get video by id
    const video=await Video.findById(videoId)

    if (!video){
        throw new apiError(404,"this video doesnot exist")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,video,"video fetched successfully")
    )
})

const updateVideo=asyncHandler(async(req,res)=>{
    const { videoId } = req.params

    // console.log(req.params.videoId);
    
    const {title:newTitle,description:newDescription}=req.body
     if ((newTitle===undefined&&newDescription===undefined)) {
        throw new apiError(400,"title or description are required")
     }
    // console.log(newTitle);
    
    if(!videoId){
        throw new apiError(404,"Video Id is required")
    }
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new apiError(400, "Invalid videoId format");
}
   
        const video=await Video.findByIdAndUpdate({_id:videoId},{
            $set: {
        ...(newTitle && { title: newTitle }),
        ...(newDescription && { description: newDescription })
      }
        },
        {
            new:true
        }
    )
   
    
return res
  .status(200)
  .json(
    new apiResponse(
      200,video,"video Details Updated Successfully"
    )
  )

})


const updateThumbnail=asyncHandler(async(req,res)=>{
const {videoId}=req.params
if (!videoId) {
     throw new apiError(404,"video Id required")
}
const thumbnailLocalPath=req.file?.path
    if(!thumbnailLocalPath){
        throw new apiError(400,"thumbnail is required")
    }
const newThumbnail=await uploadOnCloudinary(thumbnailLocalPath)
if (!newThumbnail) {
    throw new apiError(400,"thumbnail is required")
}
 const video=await Video.findById(videoId)
 if (!video) {
     throw new apiError(404,"this video doesnot exist in the database")
 }
 const oldUrl=video.thumbnail

  video.thumbnail=newThumbnail.url
  await video.save({validateBeforeSave:false})

  await deletefromCloudinary(oldUrl)

  return res
  .status(200)
  .json(
    new apiResponse(200,video,"video thumbnail updated successfully")
  )

})


const deleteVideo=asyncHandler(async(req,res)=>{
    const{videoId}=req.params

    if (!videoId) {
     throw new apiError(404,"video Id required")
    }

    try {
        await Video.deleteOne({_id:videoId})
    } catch (error) {
        throw new apiError(500,error.message||"vidio couldnt deleted ")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,{},"video deleted succssfully")
    )

})


const toggleIsPublished=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    if (!videoId) {
     throw new apiError(404,"video Id required")
    }
   const video = await Video.findOneAndUpdate(
    { _id: videoId },
    [
      { $set: { isPublished: { $not: "$isPublished" } } }
    ],
    { new: true }
  );

  return res
  .status(200)
  .json(
    new apiResponse(200,video,"video visibility updatd successfully")
  )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    updateThumbnail,
    deleteVideo,
    toggleIsPublished


}