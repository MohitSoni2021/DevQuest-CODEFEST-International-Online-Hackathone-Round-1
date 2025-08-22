import knex from "knex";
import config from "../knexfile.js";
import fs from "fs";
import path from "path";

let db = null;

// For both test and development environments, use the actual database file
const dbPath = path.resolve(process.cwd(), config.development.connection.filename);
if (!fs.existsSync(dbPath)) {
  console.error('\x1b[31m%s\x1b[0m', '========================================');
  console.error('\x1b[31m%s\x1b[0m', '  ERROR: Database file does not exist!');
  console.error('\x1b[31m%s\x1b[0m', '========================================');
  console.error('\x1b[33m%s\x1b[0m', 'Please run the following commands:');
  console.error('\x1b[33m%s\x1b[0m', '  npm run migrate');
  console.error('\x1b[33m%s\x1b[0m', '  npm run seed');
  console.error('\x1b[33m%s\x1b[0m', '');
  console.error('\x1b[33m%s\x1b[0m', 'Both the application and tests now require');
  console.error('\x1b[33m%s\x1b[0m', 'a properly initialized database file.');
  console.error('\x1b[31m%s\x1b[0m', '========================================');
}

// Use appropriate configuration based on environment
if (process.env.NODE_ENV === "test") {
  db = knex(config.test);
} else {
  db = knex(config.development);
}

export default db;
