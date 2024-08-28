import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose, { mongo } from "mongoose";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false });

        return { refreshToken, accessToken }

    } catch (error) {
        throw new apiError(500, "Something went wrong while genrating tokens")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    //user details
    //validation - not empty
    //user already exist or not
    //check for images, avatar
    //Upload on cloudinary, avatar
    // create object of user - create entry in db
    //remove password and refresh token field from response
    //check for user creation response
    //return response

    const { fullName, email, username, password } = req.body

    // console.log("Email : " + email);

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new apiError(400, "All fields are mandatory");
    }
    if (!email.includes('@')) {
        throw new apiError(400, "Email is not valid");
    }


    // const existedUser = await User.findOne({
    //     $or: [{ email }, { username }]
    // })

    // if (existedUser) {
    //     throw new apiError(409, "User is already registered with email or username")
    // }

    const existedEmail = await User.findOne({ email })
    // console.log(existedEmail);
    const existedUserName = await User.findOne({ username })

    if (existedEmail) {
        throw new apiError(409, "Email is already existed");
    }
    if (existedUserName) {
        throw new apiError(409, "username is already existed");
    }

    // console.log(req.files)

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is mandatory");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverIamge = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new apiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverIamge?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );


    if (!createdUser) {
        throw new apiError(500, "Something went wrong when registering the user")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    //data
    //Email or username
    //find the user
    //password check
    //access and refresh token 
    //send to cookies
    //response

    const { email, password, username } = req.body

    if (!email && !username) {
        throw new apiError(400, "username or email is required")
    }

    // if (!(email || username)) {
    //     throw new apiError(400, "username or email is required")
    // }

    if (!password) {
        throw new apiError(400, "Password is required")
    }
    // console.log(password)
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    // console.log(user.refreshToken);

    if (!user) {
        throw new apiError(400, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new apiError(401, "Password is wrong")
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    // console.log(accessToken)

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options).json(
            new apiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        )
})

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.
        status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new apiResponse(
                200,
                {},
                "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new apiError(401, "Unauthorised Request")
    }

    try {
        const decodeToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodeToken?._id)

        if (!user) {
            throw new apiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401, "Refresh token is expired")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new apiResponse(
                    200, { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            )
    } catch (error) {
        throw new apiError(401, "error?.message || Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body

    if (!(newPassword == confirmPassword)) {
        throw new apiError(400, "Password not matched with new password")
    }

    // console.log("NEWPassword " + newPassword)
    // console.log("OldPassword " + oldPassword)

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new apiError(400, "Old password did not match")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new apiResponse(200, {}, "Password has been changed successfully")
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new apiResponse(200, req.user, "Current User fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName } = req.body

    if (!fullName) {
        throw new apiError(400, "Fullname is required")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName
            }
        },
        { new: true }).select("-password")

    return res
        .status(200)
        .json(new apiResponse(200, req.user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file not found")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new apiError(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    },
        {
            new: true
        }
    ).select("-password")
    return res.status(200, user, "Avatar updated successfully")
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new apiError(400, "Cover Image file not found")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new apiError(400, "Error while uploading cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    },
        {
            new: true
        }
    ).select("-password")


    return res.status(200, user, "Cover image updated successfully")
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new apiError(400, "Username not found")
    }

    // User.find({ username })

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubsribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubsribed: 1,
                avatar: 1,
                coverIamge: 1,
                email: 1
            }
        }
    ])

    // console.log(channel) 
    if (!channel?.length) {
        throw new apiError(400, "Channel does not exist")
    }

    return res
        .status(200)
        .json(new apiResponse(200, channel[0], "User channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1,
                                        }
                                    }
                                ]
                            }
                        }, {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ])
    if (getWatchHistory == "") {
        throw new apiError(400, "No history Available")
    }

    return res
        .status(200)
        .json(new apiResponse(
            200,
            user[0].watchHistory,
            "Watch History fetch Successfully"
        ))
})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}