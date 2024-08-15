import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";


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
    console.log("Email : " + email);
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new apiError(400, "All fields are mandatory");
    }
    if (!email.includes('@')) {
        throw new apiError(400, "Email is not valid");
    }

    // const existedUser = User.findOne({
    //     $or: [{ email }, { username }]
    // })

    const existedEmail = User.find({ email })
    const existedUserName = User.find({ email })
    if (existedEmail) {
        throw new apiError(409, "Email is already existed");
    }
    if (existedUserName) {
        throw new apiError(409, "username is already existed");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverimage[0]?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required");
    }

    const avatarVal = await uploadOnCloudinary(avatarLocalPath);
    const coverVal = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatarVal) {
        throw new apiError(400, "Avatar file is required");
    }

    const userRefernce = await User.create({
        fullName,
        avatarVal: avatarVal.url,
        coverVal: coverVal?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(userRefernce._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new apiError(500, "Something went wrong when registering the user")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully");
    )
})

export { registerUser }