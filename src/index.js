// require('dotenv').config({path: './env'});

import dotenv, { populate } from "dotenv";

// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env"
})

const PORT = process.env.PORT || 8000;


connectDB()
.then(() => {
        app.listen(PORT, (err) => {
            console.log(`⚙️  Server is running at ${PORT}`);
        })
    })
    .catch((err) => {
        console.log(`MongoDB connection failed`, err);
    })




















/*.
import express from "express";

const app = express();

    ; (async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
            app.on("error", (error)=>{
                console.log("Error: ", error);
                throw error;
            })

            app.listen(process.env.PORT, ()=>{
                console.log(`App is listening on ${process.env.PORT}`)
            })

        } catch (error) {
            console.error("ERROR : ", error);
            throw err;
        }
    })()

    */
