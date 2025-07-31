import connectDB from "./db/db.js";
 import dotenv from "dotenv"; 
 import { app } from "./app.js";

 dotenv.config({
    path: "./.\env"
});
 const port=process.env.PORT||8000
connectDB()
.then(()=>{
    app.listen(port,()=>{
console.log(`app listening at port: ${port}`)
    })
})