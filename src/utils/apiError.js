 class apiError extends Error{
    constructor(statuscode,message="something went wrong",errors=[],stack=''){
        super(message),
        this.statuscode=statuscode,
        this.data=null,
        this.errors=errors,
        this.message=message
        this.success=false
        

        if(statck){
            this.statck=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
 }
 export {apiError}