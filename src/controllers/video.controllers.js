import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
// import { UploadStream } from "cloudinary"
import { upload } from "../middlewares/multer.middleware.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!videoLocalPath) {
        throw new apiError(400, {}, "Video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new apiError(400, {}, "Thumbnail is required")
    }

    const uploadVideo = await uploadOnCloudinary(videoLocalPath)
    const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!uploadVideo) {
        throw new apiError(400, {}, "Error occured while uploading video on cloudinary")
    }

    if (!(title && description)) {
        throw new apiError(400, {}, "Title and description are required")
    }

    const publishVideo = await Video.create(
        title,
        description,
        {
            videoFile: {
                url: uploadVideo.secure_url,
                public_id: uploadVideo.public_id
            },
            thumbnail: {
                url: uploadThumbnail.secure_url,
                public_id: uploadThumbnail.public_id
            },
            duration: uploadVideo.duration,
            owner: req.user?._id

        })

    if (!videoFile) {
        throw new apiError(400, {}, "Error occured while uploading video")
    }

    return res
        .status(200)
        .json(new apiResponse(201, { video: publishAVideo, owner: req.user._id }, "Video uploaded successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) {
        throw new apiError(400, {}, "Video Id is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new apiError(404, {}, "Invalid video Id")
    }
    const video = await Video.findById(videoId)

    if (!video) {
        throw new apiError(404, {}, "Video not found")
    }

    return res
        .status(200)
        .json(new apiResponse(201, { video }, "Video fetched Successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description, thumbnail } = req.body
    if (!videoId) {
        throw new apiError(400, {}, "Video Id is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new apiError(404, {}, "Invalid video Id")
    }

    if (!(title || description || thumbnail)) {
        throw new apiError(400, "All fields are mandatory")
    }
    const oldThumbnail = await Video.findById(videoId.thumbnail)

    if (oldThumbnail !== "") {
        await cloudinary.uploader.destroyer(oldThumbnail)
    }

    const newThumbnailLocalPath = req.Files?.thumbnail[0]?.path

    const newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath)

    if (!newThumbnail.url) {
        throw new apiError(400, {}, "No thumbnail found")
    }

    const updateVideoDetails = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title: title,
            description: description,
            thumbnail: newThumbnail.url //URL of the thumbnail
        },
        new: true
    })

    if (!updateVideoDetails) {
        throw new apiError(500, {}, "Failed to update video details")
    }

    return res
        .status(200)
        .json(new apiResponse(201, { video: updateVideoDetails }, "Video details updated"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId) {
        throw new apiError(400, {}, "Video Id is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new apiError(400, {}, "Video Id is Invalid/ Not a valid video id")
    }

    const deleteVideoRequest = await Video.findByIdAndDelete(videoId)

    if (!deleteVideoRequest) {
        throw new apiError(400, {}, "Failed to delete video")
    }

    return res
        .status(200)
        .json(new apiResponse(201, {}, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new apiError(400, {}, "Video Id is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new apiError(400, {}, "Invalid video Id")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:
                { isPublished: !req.video.isPublished }
        },
        {
            new: true
        })

    return res
        .status(200)
        .json(new apiResponse(201, { video: video }, "Success"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}