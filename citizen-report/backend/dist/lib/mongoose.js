"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoose = void 0;
exports.connectMongo = connectMongo;
exports.disconnectMongo = disconnectMongo;
const mongoose_1 = __importDefault(require("mongoose"));
exports.mongoose = mongoose_1.default;
const env_1 = require("../config/env");
/**
 * Single shared Mongoose connection. The connect promise is cached on the global
 * object so that hot reloads (tsx watch) and serverless warm invocations reuse
 * one connection instead of opening a new pool every time.
 */
mongoose_1.default.set('strictQuery', true);
const globalForMongoose = globalThis;
function connectMongo() {
    if (globalForMongoose.mongoosePromise)
        return globalForMongoose.mongoosePromise;
    const promise = mongoose_1.default.connect(env_1.env.MONGODB_URI, {
        // Fail fast if the cluster is unreachable rather than buffering forever.
        serverSelectionTimeoutMS: 10_000,
    });
    globalForMongoose.mongoosePromise = promise;
    if (env_1.isProd) {
        // In prod we still cache, but drop the cached promise on failure so a later
        // request can retry the connection.
        promise.catch(() => {
            globalForMongoose.mongoosePromise = undefined;
        });
    }
    return promise;
}
async function disconnectMongo() {
    globalForMongoose.mongoosePromise = undefined;
    await mongoose_1.default.disconnect();
}
//# sourceMappingURL=mongoose.js.map