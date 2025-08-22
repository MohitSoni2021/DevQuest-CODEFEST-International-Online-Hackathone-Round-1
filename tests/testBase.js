import session from "supertest-session";
import fs from "fs";
import path from "path";

// Set up test environment
process.env.NODE_ENV = "test";
process.env.JWT_PRIVATE_KEY = "testEnvironmentJwtSecretKey";

const createSuperTestSession = (app) => {
  return session(app);
};

function checkDatabaseExists() {
  const dbPath = path.resolve(process.cwd(), 'main.sqlite3');
  if (!fs.existsSync(dbPath)) {
    console.error('\x1b[31m%s\x1b[0m', '===============================================');
    console.error('\x1b[31m%s\x1b[0m', 'ERROR: Database file (main.sqlite3) not found!');
    console.error('\x1b[31m%s\x1b[0m', 'Tests will fail because they now use the actual database.');
    console.error('\x1b[33m%s\x1b[0m', 'Please run the following commands:');
    console.error('\x1b[33m%s\x1b[0m', '  npm run migrate');
    console.error('\x1b[33m%s\x1b[0m', '  npm run seed');
    console.error('\x1b[31m%s\x1b[0m', '===============================================');
    throw new Error("Database file not found. Run migrations and seeds first.");
  }
  return true;
}

function resetDatabase(_db) {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if database exists before proceeding
      checkDatabaseExists();
      // Don't run migrations/seeds automatically - use existing database
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

export default {
  createSuperTestSession,
  resetDatabase,
};
