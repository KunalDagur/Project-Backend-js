import { v2 as cloudinary } from "cloudinary";
import fs, { unlink, unlinkSync } from "fs";
import { type } from "os";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localfilepath) => {
    try {
        if (!localfilepath) {
            return null;
        } else {
            const response = await cloudinary.uploader.upload(localfilepath, {
                resource_type: "auto"
            });
            console.log("File has been upload successfully", response.url);
            fs.unlinkSync(localfilepath)
            return response;
        }
    } catch (error) {
        fs.unlinkSync(localfilepath); //Will remove the temp file as upload operation on cloudinary has failed 
        return null;
    }
}

export { uploadOnCloudinary }