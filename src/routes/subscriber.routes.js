import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getUserChannelSubscriber, toggleSubscription } from "../controllers/subscriber.controllers.js";

const router=Router()

router.route("/toggleSubscription/:channelId").post(verifyJwt,toggleSubscription)
router.route("/getChannelSubscriber/:channelId").post(getUserChannelSubscriber)
router.route("/getSubscribedChannel/:userId").post(toggleSubscription)






export default router