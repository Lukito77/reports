import mongoose from 'mongoose';
import { env, isProd } from '../config/env';

/**
 * Single shared Mongoose connection. The connect promise is cached on the global
 * object so that hot reloads (tsx watch) and serverless warm invocations reuse
 * one connection instead of opening a new pool every time.
 */
mongoose.set('strictQuery', true);

const globalForMongoose = globalThis as unknown as {
  mongoosePromise?: Promise<typeof mongoose>;
};

export function connectMongo(): Promise<typeof mongoose> {
  if (globalForMongoose.mongoosePromise) return globalForMongoose.mongoosePromise;

  const promise = mongoose.connect(env.MONGODB_URI, {
    // Fail fast if the cluster is unreachable rather than buffering forever.
    serverSelectionTimeoutMS: 10_000,
  });

  globalForMongoose.mongoosePromise = promise;
  if (isProd) {
    // In prod we still cache, but drop the cached promise on failure so a later
    // request can retry the connection.
    promise.catch(() => {
      globalForMongoose.mongoosePromise = undefined;
    });
  }
  return promise;
}

export async function disconnectMongo(): Promise<void> {
  globalForMongoose.mongoosePromise = undefined;
  await mongoose.disconnect();
}

export { mongoose };
