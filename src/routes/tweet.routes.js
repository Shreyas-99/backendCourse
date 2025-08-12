import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";





const router=Router()

router.route("/createTweet").post(verifyJwt)




export default router