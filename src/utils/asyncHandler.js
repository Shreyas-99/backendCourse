const asyncHandler=(func)=>{
    return (req,res,next)=>{
Promise.resolve(func(req,res,next)).catch((err)=>{console.log("ERROR came",err);
})
}}

export {asyncHandler}





// const asyncHandler=(func)=>{async (req,res,next)=>{

//     try {
//         func(req,res,next);
//     } catch (err) {
//         res.status(err.code||500).json({
//             success:false,
//             message:err.message
//         })
//     }
// }}