import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweets.models.js"
import { User } from "../models/user.models.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { loginUser } from "./user.controllers.js"
import { response } from "express"

const createTweet = asyncHandler(async (req, res) => {
    // TODO: create tweet

    const { content } = req.body;

    console.log(content)
    if (!content?.trim()) {
        throw new apiError(400, "Content cannot be empty")
    }

    const tweetResponse = await Tweet.create({ content: content, owner: req.user })

    if (!tweetResponse) {
        throw new apiError(500, "Error while creating tweet")
    }


    return res
        .status(201)
        .json(new apiResponse(201, { content, owner: req.user }, "Tweet has been created successfully"))

})


const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params

    if (!userId) {
        throw new apiError(400, "User not found")
    }

    if (isValidObjectId(userId)) {
        throw new apiError(400, "Invalid user ID")
    }


    const tweets = await Tweet.find({ owner: req.user._id })

    return res
        .status(200)
        .json(new apiResponse(200, { tweets }, "User tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { updatedContent } = req.body;
    const { tweetId } = req.params

    if (!tweetId) {
        throw new apiError(400, "Tweet not found")
    }

    if (!updatedContent?.trim()) {
        throw new apiError(400, "Updated content cannot be empty")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: updatedContent
            }

        }, { new: true })

    if (!tweet) {
        throw new apiError(500, "Error while updating tweet")
    }


    return res
        .status(201)
        .json(new apiResponse(201, tweet, "Tweet has been updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    if (!tweetId) {
        throw new apiError(400, "Tweet not found")
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId)

    return res
        .status(204)
        .json(new apiResponse(204, {}, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}