import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Subscriber } from "../models/subscribe.model.js";
import { asyncHandler } from "../utils/asyncHandler";
import mongoose from "mongoose";


const toggleSubscription =asyncHandler(async(req,res)=>{
    const {channelId}=req.params

    const {userId}=req.user
    if (!userId) {
        throw new apiError(400,"user id is not there")
    }
    const session =await mongoose.startSession()
    await session.startTransaction()
    try {
       
    
        const deleted=await Subscriber.findOneAndDelete({$and:[{subscriber:userId},{channel:channelId}]})
    
        if(!deleted){
            await Subscriber.create({
                subscriber:userId,
                channel:channelId
            })
        }
        session.commitTransaction()
        session.endSession()

        return res
        .status(200)
        .json(new apiResponse(200,{},"toggled successfully"))
        
    } catch (error) {
        session.abortTransaction()
        session.endSession()
         return res
         .status(500)
         .json({ success: false, error: err.message });
    }

})


const getUserChannelSubscriber=asyncHandler(async(req,res)=>{
    const {channelId}=req.params
     
    if (!channelId) {
        throw new apiError(400,"channel id is not there")
    }
    const subscriberList=await Subscriber.aggregate([
        {
            $match:{channel:new mongoose.Types.ObjectId(String(channelId))}
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
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
                    subscriber:{
                        $first:"$subscriber"
                    }
                }
        },
        {
             $sort: { createdAt: 1 } 
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(200,subscriberList,"subscriber List fetched successfully")
    )

})

const getSubscribedChannel=asyncHandler(async(req,res)=>{
    const {userId}=req.params
     if (!userId) {
        throw new apiError(400,"user is is required")
     }

     const subscribedChannelList=await Subscriber.aggregate([
        {
            $match:{subscriber: new mongoose.Types.ObjectId(String(userId))}
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscriberTo",
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
                channel:{
                    $first:"$subscriberTo"
                }
            }
        }

     ])


     return res
     .status(200)
     .json(
        new apiResponse(200,subscribedChannelList,"subscribed Channel List fetched successfully")
     )
})







export {toggleSubscription,getUserChannelSubscriber,getSubscribedChannel}