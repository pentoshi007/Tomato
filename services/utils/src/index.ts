import express from "express";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import cors from "cors";
import uploadRoutes from "./routes/cloudinary.js";
dotenv.config();

const app = express();
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(cors());


const {CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET} = process.env;

if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_API_SECRET) {
    throw new Error("Cloudinary credentials are not set");
}

cloudinary.v2.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_API_SECRET,
});

app.use('/api', uploadRoutes);
 function startServer() {
    try {
        app.listen(process.env.PORT || 3002, () => {
            console.log(`Utils service is running on port ${process.env.PORT || 3002}`);
        });
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

startServer();