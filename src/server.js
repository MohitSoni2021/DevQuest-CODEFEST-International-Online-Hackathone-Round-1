import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";

import auth from "./middleware/auth.js";

// Load environment variables
const envResult = dotenv.config();

// Check if .env file exists and contains required variables
const checkEnvRequirements = () => {
  // Check if .env file exists (required for all environments now)
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: .env file not found!');
    console.error('\x1b[33m%s\x1b[0m', 'Please create a .env file in the root directory.');
    console.error('\x1b[33m%s\x1b[0m', 'Required variables: PORT, JWT_PRIVATE_KEY');
    return false;
  }
  
  // Check for required environment variables
  if (!process.env.JWT_PRIVATE_KEY) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: JWT_PRIVATE_KEY is not defined in .env file');
    return false;
  }
  
  // Check if database exists (required for all environments)
  const dbPath = path.resolve(process.cwd(), 'main.sqlite3');
  if (!fs.existsSync(dbPath)) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: SQLite database not found!');
    console.error('\x1b[33m%s\x1b[0m', 'Please run the following commands:');
    console.error('\x1b[33m%s\x1b[0m', '  npm run migrate');
    console.error('\x1b[33m%s\x1b[0m', '  npm run seed');
    return false;
  }
  
  return true;
};

// Initialize the app only if environment is properly configured
const app = express();

app.use(express.json());
app.use(cors());

// Check environment before setting up routes for all environments
if (!checkEnvRequirements()) {
  console.error('\x1b[31m%s\x1b[0m', 'Server initialization failed due to missing environment configuration');
  process.exit(1);
}

app.use("/api/auth", authRoutes);
app.use("/api/product", auth, productRoutes);

const port = process.env.PORT || 3001;

const server =
  process.env.NODE_ENV === "test"
    ? app.listen(0, () => {
        console.log(`Server is running on port ${server.address().port}`);
      })
    : app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });

export default server;
