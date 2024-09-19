import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import cloudinary from "cloudinary"
// import { UploadStream } from "cloudinary"
import { upload } from "../middlewares/multer.middleware.js"


const getAllVideos = asyncHandler(async (req, res) => {
    // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = 1, userId = "" } = req.query
    //TODO: get all videos based on query, sort, pagination

    var videoAggregate;
    try {
        videoAggregate = Video.aggregate(
            [
                {
                    $match: {
                        $or: [
                            { title: { $regex: query, $options: "i" } },
                            { description: { $regex: query, $options: "i" } }
                        ]
                    }

                },
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    fullName: 1,
                                    avatar: "$avatar.url",
                                    username: 1,
                                }
                            },

                        ]
                    }
                },

                {
                    $addFields: {
                        owner: {
                            $first: "$owner",
                        },
                    },
                },

                {
                    $sort: {
                        [sortBy || "createdAt"]: sortType || 1
                    }
                },

            ]
        )
    } catch (error) {
        // console.error("Error in aggregation:", error);
        throw new apiError(500, error.message || "Internal server error in video aggregation");
    }

    const options = {
        page,
        limit,
        customLabels: {
            totalDocs: "totalVideos",
            docs: "videos",

        },
        skip: (page - 1) * limit,
        limit: parseInt(limit),
    }

    Video.aggregatePaginate(videoAggregate, options)
        .then(result => {
            // console.log("first")
            if (result?.videos?.length === 0) {
                return res.status(200).json(new apiResponse(200, [], "No videos found"))
            }

            return res.status(200)
                .json(
                    new apiResponse(
                        200,
                        result,
                        "video fetched successfully"
                    )
                )
        }).catch(error => {
            // console.log("error ::", error)
            throw new apiError(500, error?.message || "Internal server error in video aggregate Paginate")
        })
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
        throw new apiError(400, "Error occured while uploading video on cloudinary")
    }

    if (!(title || description)) {
        throw new apiError(400, {}, "Title and description are required")
    }

    //console.log(uploadVideo.public_id)

    const publishVideo = await Video.create({
        title,
        description,
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

    // console.log(uploadVideo.duration)

    if (!publishVideo) {
        throw new apiError(400, {}, "Error occured while uploading video")
    }

    return res
        .status(200)
        .json(new apiResponse(201, { video: publishVideo, owner: req.user._id, isPublished: true }, "Video has been published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) {
        throw new apiError(400, {}, "Video Id is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new apiError(401, "Invalid video Id")
    }
    const video = await Video.findById(videoId)

    if (!video) {
        throw new apiError(404, "Video not found")
    }

    return res
        .status(200)
        .json(new apiResponse(201, { video }, "Video fetched Successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body

    if (!videoId) {
        throw new apiError(400, "Video Id is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new apiError(404, "Invalid video Id")
    }

    if (!(title || description)) {
        throw new apiError(400, "All fields are mandatory")
    }

    const newThumbnailLocalPath = req.file?.path

    const newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath)

    // console.log(newThumbnail)
    if (!newThumbnail) {
        throw new apiError(400, "No thumbnail found")
    }

    const updateVideoDetails = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title: title,
            description: description,
            thumbnail: newThumbnail //URL of the thumbnail
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
        throw new apiError(400, "Video Id is Invalid/ Not a valid video id")
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
        throw new apiError(400, "Invalid video Id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new apiError(404, "Video not found")
    }

    video.isPublished = !video.isPublished
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