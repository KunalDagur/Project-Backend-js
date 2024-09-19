import mongoose from "mongoose"
import { Video } from "../models/video.models.js"
import { Subscription } from "../models/subscription.models.js"
import { Like } from "../models/likes.models.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

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
            throw new apiError(500, error?.message || "Internal server error in video aggregate Paginate")
        })
})

export {
    getChannelStats,
    getChannelVideos
}