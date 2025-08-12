import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { getAllVideos, getVideoById, publishAVideo, updateThumbnail, updateVideo,deleteVideo, toggleIsPublished } from "../controllers/video.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";



const router=Router()

router.route("/upload-video").post(
    verifyJwt,
    upload.fields([
        {
            name:"videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),
        publishAVideo
)
router.route("/search").post(getAllVideos)
router.route("/v/:videoId").post(getVideoById)
router.route("/update-details/:videoId").patch(verifyJwt,updateVideo)
router.route("/update-thumbnail/:videoId").patch(verifyJwt,upload.single("thumbnail"),updateThumbnail)
router.route("/delete-video/:videoId").delete(verifyJwt,deleteVideo)
router.route("/toggleVisibility/:videoId").patch(toggleIsPublished)

export default router