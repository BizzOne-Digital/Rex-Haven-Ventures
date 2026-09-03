import "server-only";
import mongoose from "mongoose";

/**
 * Cached Mongoose connection.
 *
 * Next.js hot-reloads modules in development and runs route handlers in a
 * long-lived Node process in production. Without caching, every reload/request
 * would open a new connection pool and eventually exhaust MongoDB's limits.
 * The cache is parked on `globalThis` so it survives module re-evaluation.
 *
 * The connection string is read from `MONGODB_URI` and never leaves the server
 * (no NEXT_PUBLIC_ prefix, and this module is `server-only`).
 */

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  __rexHavenMongoose?: MongooseCache;
};

const cache: MongooseCache = (globalForMongoose.__rexHavenMongoose ??= {
  conn: null,
  promise: null,
});

/** Thrown when the database is not configured or unreachable. */
export class DatabaseUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

/** True when a connection string is present. Lets callers degrade gracefully. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim());
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new DatabaseUnavailableError(
      "MONGODB_URI is not set. Add it to .env.local — see .env.example.",
    );
  }

  if (cache.conn && cache.conn.connection.readyState === 1) return cache.conn;

  if (!cache.promise) {
    // `bufferCommands: false` surfaces connection problems as errors straight
    // away instead of queueing queries against a dead socket.
    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10_000,
      })
      .catch((error: unknown) => {
        // Clear the rejected promise so the next request can retry.
        cache.promise = null;
        throw error;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    throw new DatabaseUnavailableError(`Could not connect to MongoDB: ${detail}`);
  }

  return cache.conn;
}

/** Ensures indexes declared on the schemas exist. Safe to call repeatedly. */
export async function syncIndexes(): Promise<void> {
  const conn = await connectToDatabase();
  await Promise.all(
    Object.values(conn.models).map((model) => model.syncIndexes().catch(() => undefined)),
  );
}
