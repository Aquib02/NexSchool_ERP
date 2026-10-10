import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import ENV from './env.js';

let isConnected = false;
let embeddedMongoInstance = null;

// Ensure Windows VC++ runtime DLL paths are accessible for mongod if present
if (process.platform === 'win32') {
  const possibleDllDirs = [
    'C:\\Program Files\\Dell\\DTP\\InstrumentationSubAgent',
    'C:\\Program Files\\Dell\\DTP\\DiagnosticsSubAgent',
  ];
  for (const dir of possibleDllDirs) {
    if (fs.existsSync(dir) && !process.env.PATH?.includes(dir)) {
      process.env.PATH = `${dir};${process.env.PATH || ''}`;
    }
  }
}

const setupConnectionEvents = () => {
  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[MongoDB] Disconnected from database.');
  });
};

export const connectDB = async (customUri = null) => {
  let uri = customUri || ENV.MONGO_URI;

  if (isConnected) {
    return mongoose.connection;
  }

  const isLocal = uri.includes('localhost') || uri.includes('127.0.0.1');
  const connectOptions = {
    autoIndex: true,
    serverSelectionTimeoutMS: isLocal ? 3000 : 15000,
  };

  try {
    const conn = await mongoose.connect(uri, connectOptions);
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    setupConnectionEvents();

    // Auto-seed if database is fresh (including remote / Atlas clusters)
    try {
      const Role = (await import('../models/Role.js')).default;
      const roleCount = await Role.countDocuments();
      if (roleCount === 0) {
        console.log('[MongoDB] Fresh database detected. Auto-seeding initial roles and Super Admin...');
        const seedRBAC = (await import('../seeders/seedRbac.js')).default;
        await seedRBAC();
      }
    } catch (seedErr) {
      console.warn('[MongoDB] Auto-seeding check skipped:', seedErr.message);
    }

    return conn;
  } catch (initialError) {
    // If local MongoDB is not running, spin up embedded persistent instance in development
    if (isLocal && (ENV.NODE_ENV === 'development' || !ENV.NODE_ENV)) {
      console.warn(`[MongoDB] Local MongoDB service not active on ${uri}. Starting embedded database engine...`);
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const dataDir = path.resolve(process.cwd(), '.mongo_data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        embeddedMongoInstance = await MongoMemoryServer.create({
          instance: {
            dbPath: dataDir,
            port: 27017,
            storageEngine: 'wiredTiger',
          },
        });

        uri = embeddedMongoInstance.getUri();
        const conn = await mongoose.connect(uri, { autoIndex: true });
        isConnected = true;
        console.log(`[MongoDB] Embedded MongoDB running at ${uri} (Persisted in backend/.mongo_data)`);
        setupConnectionEvents();

        // Auto-seed if database is fresh
        try {
          const Role = (await import('../models/Role.js')).default;
          const roleCount = await Role.countDocuments();
          if (roleCount === 0) {
            console.log('[MongoDB] Fresh database detected. Auto-seeding initial roles and Super Admin...');
            const seedRBAC = (await import('../seeders/seedRbac.js')).default;
            await seedRBAC();
          }
        } catch (seedErr) {
          console.warn('[MongoDB] Auto-seeding check skipped:', seedErr.message);
        }

        return conn;
      } catch (embeddedErr) {
        console.error('[MongoDB] Failed to start embedded MongoDB:', embeddedErr.message);
      }
    }

    console.error('[MongoDB] Initial connection error:', initialError.message);
    if (ENV.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw initialError;
  }
};

export const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[MongoDB] Disconnected cleanly.');
  }
  if (embeddedMongoInstance) {
    await embeddedMongoInstance.stop();
    embeddedMongoInstance = null;
    console.log('[MongoDB] Embedded MongoDB engine stopped.');
  }
};

export default connectDB;
