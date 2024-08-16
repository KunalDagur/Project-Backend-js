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

export { registerUser }