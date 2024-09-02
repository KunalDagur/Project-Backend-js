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

    if (!content) {
        throw new apiError(400, "Content is required")
    }

    console.log(content)

    const tweetResponse = await Tweet.create(
        {
            owner: req.user.username,
            content: content
        }
    )
    console.log(req.user.username)



    if (!req.user.username) {
        throw new apiError(401, {}, "User not found")
    }

    if (!tweetResponse.success) {
        throw new apiError(401, {}, "Tweet failed")
    }
    if (tweetResponse.success) {
        throw new apiError(401, {}, "Failed to create tweet")
    }




    console.log(req.user.username)



    console.log(req.user._id);

    return res
        .status(201)
        .json(new apiResponse(201, { content, username, owner }, "Tweet has been created successfully"))

})


const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { username } = req.User

    if (!username?.trim()) {
        throw new apiError(400, "Username not found")
    }

    const Twitter = await Tweet.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "_id",
                foreignField: "Twitter",
                as: "tweets"
            }
        }
    ])
    // console.log(Twitter);
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    // const tweet = await Tweet.findByIdAndUpdate(req.Tweet.content)
    // console.log(tweet)

    // return res
    //     .status(201)
    //     .json(new apiResponse(201, tweet, "Tweet has been updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}