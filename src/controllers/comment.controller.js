import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comments.models.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { json } from "express"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid video ID")
    }

    let skip = (page - 1) * limit
    const allComments = await Comment.find({ video: videoId }).skip(skip).limit(limit)

    if (!allComments) {
        throw new apiError(404, {}, "No comments found")
    }


    return res
        .status(200)
        .json(new apiResponse(201, { allComments: allComments }, "Comments fetched successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new apiError(400, "Video ID is not valid")
    }

    const { content } = req.body

    if (!content) {
        throw new apiError(400, "Comment can not be empty")
    }
    console.log(content)
    const comment = await Comment.create({ videos: videoId, content: content, owner: req.user?._id }
        ,
        {
            new: true
        }
    )

    if (!comment) {
        throw new apiError(400, {}, "Error while creating comment")
    }

    return res
        .status(200)
        .json(new apiResponse(201, comment, "Comment created successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { commentId } = req.params
    const { commentValue } = req.body

    if (!isValidObjectId(commentId)) {
        throw new apiError(400, "Invalid comment ID")
    }

    if (!commentId) {
        throw new apiError(400, {}, "Comment not found")

    }
    if (!commentValue) {
        throw new apiError(400, "Comment can not be empty")
    }


    const updatedComment = await Comment.findByIdAndUpdate(
        commentId, {
        $set: {
            content: commentValue
        },
    }, {
        new: true
    }
    )

    if (!updatedComment) {
        throw new apiError(404, {}, "Comment does not updated")
    }

    return res
        .status(200)
        .json(new apiResponse(201, updateComment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid video ID")
    }

    if (!isValidObjectId(commentId)) {
        throw new apiError(400, "Invalid Comment ID")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if (!deletedComment) {
        throw new apiError(404, {}, "Unable to delete comment")
    }

    return res
        .status(200)
        .json(new apiResponse(202, { getVideoComments }, "Comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}