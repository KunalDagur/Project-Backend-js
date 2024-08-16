import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

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

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new apiError(400, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new apiError(401, "Password did not match")
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            // new apiResponse(
            //     200, {
            //     user: loggedInUser, accessToken, refreshToken
            // },
            "User logged in successfully"
        )
    // )
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

export { registerUser, loginUser, logOutUser, refreshAccessToken }