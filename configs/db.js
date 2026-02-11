'use strict';

import mongoose from "mongoose";

export const dbConnection = async () => {
    try {
        mongoose.connection.on('error', (error) => {
            console.log("MongoDB | Error connecting to database: " + error);
            mongoose.disconnect();
        });
        mongoose.connection.on('connecting', () => {
            console.log("MongoDB | Connecting to database");
        });
        mongoose.connection.on('connected', () => {
            console.log("MongoDB | Connected to database");
        });
        mongoose.connection.on('open', () => {
            console.log("MongoDB | Database connection is open  and ready to use");
        });
        mongoose.connection.on('reconnected', () => {
            console.log("MongoDB | Reconnected to database");
        });
        mongoose.connection.on('disconnected', () => {
            console.log("MongoDB | Disconnected from database");
        });

        await mongoose.connect(process.env.URL_MONGO, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10
        });
    } catch (error) {
        console.log("MongoDB | Error connecting to database: " + error);
    }
}

const gracefulShutdown = async (signal) => {
    console.log(`MongoDB | Received ${signal}. Closing database connection...`);
    try {
        await mongoose.connection.close();
        console.log("MongoDB | Database connection closed. Exiting process.");
        process.exit(0);
    } catch (error) {
        console.error(`MongoDB | Error during graceful shutdown: ${error}`);
    }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));