import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Tweet, Tweet } from "../models/tweet.model.js";


const createTweet=asyncHandler(async (req,res)=>{
    const {userId}=req.user
    if (!userId) {
        throw new apiError(400,"user id is not there")
    }
    const {content}=req.body
    if (!content) {
        throw new apiError(400,"tweet content is required")
    }
    const tweet=await Tweet.create({
        owner:userId,
        content
    })
    
  return res
  .status(201)
  .json(new apiResponse(200,tweet,"tweet created successfully"))
})


const getUserTweet=asyncHandler(async(req,res)=>{
    const {userId}=req.user
    if (!userId) {
        throw new apiError(400,"user id is not there")
    }
    const tweet=Tweet.find({owner:userId})

     return res
  .status(201)
  .json(new apiResponse(200,tweet,tweet===null?"there is no tweet by thus user":"tweet created successfully"))

})

const upadatTweet=asyncHandler(async(req,res)=>{

})
export {createTweet,getUserTweet,upadatTweet}