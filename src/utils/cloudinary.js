import { v2 as cloudinary  } from "cloudinary";
import { error } from "console";
import fs from "fs"

import { apiError } from "./apiError.js";


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});
const uploadOnCloudinary= async (localFilePath)=>{

    try {
        if(!localFilePath) return null
        const response=await cloudinary.uploader.upload(localFilePath,{resource_type:'auto'})
        // succefully uploaded
         fs.unlinkSync(localFilePath)
         return response
    } catch (error) {
         fs.unlinkSync(localFilePath)
         return null
    }
}

const deletefromCloudinary=async (urlFromDatabase)=>{
  if (urlFromDatabase===""||urlFromDatabase===null,urlFromDatabase===undefined) {
    return null
  }
  const splittedArray1=urlFromDatabase.split("/")
  const splittedArray2=splittedArray1[7]
  const public_id=splittedArray2.split(".").at(-2)
//  const public_id=urlFromDatabase?.split("/").at(-1);
 if (!public_id) {
  return null;
 }

 const response=await cloudinary.uploader.destroy(public_id,{resource_type:'auto'},(error,result)=>{
  if(error){
    throw new apiError(500,error?.message||'error while deleting the assets')
  }
  
 })
 return response
}
export {uploadOnCloudinary,deletefromCloudinary}