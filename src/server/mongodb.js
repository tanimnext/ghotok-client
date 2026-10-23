import { MongoClient } from 'mongodb';

// One MongoDB connection for the website's server code (Better Auth and the SSLCommerz
// checkout). It MUST be the same database as ghotok-server's MONGODB_URI: the API reads the
// accounts, sessions and payments written here. The database name comes from the URI.

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/ghotok';

// Kept on globalThis so Next.js hot reloads in development reuse the connection.
const cache = (globalThis.__ghotokMongo ??= { client: null, uri: null });

/** The shared MongoClient. The driver connects on first use. */
export function getMongoClient() {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  if (!cache.client || cache.uri !== uri) {
    cache.client = new MongoClient(uri);
    cache.uri = uri;
  }
  return cache.client;
}

export const getDb = () => getMongoClient().db();
