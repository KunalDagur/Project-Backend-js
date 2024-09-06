import mongoose, { isValidObjectId, set } from "mongoose"
import { Playlist } from "../models/playlist.models.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const owner = req.user?._id

    //TODO: create playlist
    if (!name) {
        throw new apiError(400, {}, "Playlist name required")
    }

    if (!description) {
        throw new apiError(400, {}, "Playlist description required")
    }
    const playlist = await Playlist.create({ name, description, owner, video: req.user.video });

    if (!playlist) {
        throw new apiError(400, {}, "Failed to create playlist")
    }

    return res
        .status(200)
        .json(new apiResponse(201, { playlist }, "Playlist created successfully"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    // console.log(userId)
    //TODO: get user playlists

    if (!userId) {
        throw new apiError(404, {}, "User ID required")
    }

    if (!isValidObjectId(userId)) {
        throw new apiError(400, "Invalid user ID")
    }

    const playlists = await Playlist.find({ owner: userId })


    if (!playlists) {
        throw new apiError(404, {}, "No playlists found");
    }

    return res
        .status(200)
        .json(new apiResponse(200, { playlists }, "Playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    if (!playlistId) {
        throw new apiError(404, {}, "Playlist Id required")
    }

    // console.log(playlistId)

    if (!isValidObjectId(playlistId)) {
        throw new apiError(400, "Invalid Playlist ID");
    }

    // console.log(playlistId)

    const playList = await Playlist.findById(playlistId)

    if (!playList) {
        throw new apiError(404, {}, "Playlist not found")
    }

    return res
        .status(200)
        .json(new apiResponse(201, playList, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId) {
        throw new apiError(400, {}, "Playlist id required")
    }

    if (!videoId) {
        throw new apiError(400, {}, "Video id required")
    }

    if (isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid video ID")
    }


    const updatedPlaylist = Playlist.findByIdAndUpdate(
        playlistId, {
        $push: {
            videoId: videoId
        },
        new: true
    })

    if (!updatePlaylist) {
        throw new apiError(400, {}, "Error occurred while adding video to playlist")
    }

    return res
        .status(200)
        .json(201, { updatePlaylist }, "Video has been added to playlist")
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    if (!playlistId) {
        throw new apiError(400, {}, "Playlist Id required")
    }

    if (!videoId) {
        throw new apiError(400, {}, "Video Id required")
    }


    if (isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid video Id")
    }
    if (isValidObjectId(playlistId)) {
        throw new apiError(400, "Invalid playlist Id")
    }
    const updatePlaylist = await Playlist.findByIdAndDelete(
        playlistId, {
        $pull: {
            videoId: videoId
        },
        new: true
    }
    )

    if (!updatePlaylist) {
        throw new apiError(400, {}, "Error occured while removing videofrom playlist")
    }

    return res
        .status(200)
        .json(new apiResponse(201, { updatePlaylist }, "Playlist has been updated successfully"))
})


const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    if (!playlistId) {
        throw new apiError(400, {}, "Playlist Id required")
    }

    if (!isValidObjectId(playlistId)) {
        throw new apiError(400, "Playlist not found")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    if (!deletedPlaylist) {
        throw new apiError(401, {}, "Error occured while deleting playlist")
    }

    return res
        .status(200)
        .json(new apiResponse(201, {}, "Playlist has been deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    // console.log(playlistId)

    if (!playlistId) {
        throw new apiError(400, {}, "Playlist id required")
    }

    if (!isValidObjectId(playlistId)) {
        throw new apiError(400, "Playlist not found")
    }

    if (!name) {
        throw new apiError(400, {}, "Playlist name required")
    }

    if (!description) {
        throw new apiError(400, {}, "Playlist description required")
    }

    const updateplaylistDetails = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name,
                description: description
            },
        },
        { new: true }
    )

    if (!updateplaylistDetails) {
        throw new apiError(400, {}, "Error occurred while updating playlist details")
    }

    return res
        .status(200)
        .json(new apiResponse(201, updateplaylistDetails, "Playlist details updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}