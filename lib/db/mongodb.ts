import mongoose from "mongoose";

const connectionUri = process.env.MONGODB_URI;

if (!connectionUri) {
  throw new Error("Missing MONGODB_URI. Add your MongoDB Atlas connection string to .env.local.");
}

interface MongooseCache {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  __bhojanHubMongoose?: MongooseCache;
};

const cache = globalWithMongoose.__bhojanHubMongoose ?? {
  connection: null,
  promise: null,
};

globalWithMongoose.__bhojanHubMongoose = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.connection) return cache.connection;

  if (!cache.promise) {
    cache.promise = mongoose.connect(connectionUri!, { bufferCommands: false });
  }

  cache.connection = await cache.promise;
  return cache.connection;
}
