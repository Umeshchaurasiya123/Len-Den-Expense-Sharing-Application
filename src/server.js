import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path:'.env'
})

connectDB()
.then(()=>{
    const server = app.listen(process.env.PORT || 0, ()=> {
        const assignedPort = server.address().port
        console.log(`⚙️ Server is running at port : ${assignedPort}`);
    } )

})
.catch((error)=>{
    console.log("MongoDB Connection Failed !!!!!", error)
})


