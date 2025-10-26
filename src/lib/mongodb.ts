import mongoose from "mongoose";

// Get MongoDB URI from environment variables
const getMongoDBUri = (): string => {
  // Try multiple sources for the MongoDB URI
  const uri = process.env.MONGODB_URI ||
    process.env.NEXT_PUBLIC_MONGODB_URI ||
    'mongodb+srv://samalarajesh12_db_user:lQvX67tC3PRKTAwj@cluster0.nnwfqns.mongodb.net/newDB';

  if (!uri) {
    throw new Error(
      "❌ MONGODB_URI environment variable is not defined. Please check your .env or .env.local file."
    );
  }

  console.log("🔗 MongoDB URI found:", uri.substring(0, 50) + "...");
  return uri;
};

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  console.log("⚡ connectDB() called");

  if (cached.conn) {
    console.log("♻️ Using existing MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("🔄 Creating new MongoDB connection...");
    const opts = { bufferCommands: false };

    const MONGODB_URI = getMongoDBUri();

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("✅ Successfully connected to MongoDB");
        console.log(
          "📊 Database name:",
          mongoose.connection.db?.databaseName || "Unknown"
        );
        return mongoose;
      })
      .catch((err) => {
        console.error("❌ Failed to connect to MongoDB:", err.message);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error("🔥 MongoDB connection error (outer catch):", e);
    cached.promise = null; // reset so it can retry next time
    throw e;
  }

  return cached.conn;
}

export default connectDB;

declare global {
  // eslint-disable-next-line no-var
  var mongoose: any;
}
