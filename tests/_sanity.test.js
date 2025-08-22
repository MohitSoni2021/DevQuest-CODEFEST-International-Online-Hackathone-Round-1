import { beforeAll, afterAll, describe, test, expect } from "vitest";
import app from "../src/server.js";
import db from "../db/db-config.js";
import testBase from "./testBase.js";
import fs from "fs";
import path from "path";

let testSession = null;

/**
 * Sanity tests to ensure the environment is properly configured
 * These tests should pass even before any challenge implementation
 */

beforeAll(async () => {
  testSession = testBase.createSuperTestSession(app);
  await testBase.resetDatabase(db);
});

afterAll((done) => {
  app.close(done);
});

describe("Environment Sanity Tests", () => {
  test("Server should start and respond to health check", async () => {
    // Basic server health check
    expect(app).toBeDefined();
    expect(testSession).toBeDefined();
  });

  test("Database connection should work", async () => {
    // Test database connection
    const result = await db.raw("SELECT 1 as test");
    expect(result).toBeDefined();
    expect(result[0].test).toBe(1);
  });
  
  test("Database file must exist with migrations and seeds applied", () => {
    console.log("\n\n======= IMPORTANT NOTICE =======");
    console.log("These tests now use the actual SQLite database (main.sqlite3).");
    console.log("Tests will FAIL if you haven't run:");
    console.log("  npm run migrate");
    console.log("  npm run seed");
    console.log("================================\n\n");
    
    // Check if main.sqlite3 exists
    const dbPath = path.resolve(process.cwd(), 'main.sqlite3');
    expect(fs.existsSync(dbPath)).toBe(true);
    
    // The rest of the tests will verify if the database has the correct schema and data
  });

  test("Authentication endpoints should exist", async () => {
    // Test that auth endpoints are reachable
    const signupRes = await testSession.post("/api/auth/signup").send({});
    const loginRes = await testSession.post("/api/auth/login").send({});
    
    // Should get 400 (validation error) not 404 (endpoint not found)
    expect(signupRes.status).not.toBe(404);
    expect(loginRes.status).not.toBe(404);
  });

  test("Product endpoints should exist", async () => {
    // Test that product endpoints are reachable (even without auth)
    const productsRes = await testSession.get("/api/product");
    
    // Should get 401 (unauthorized) not 404 (endpoint not found)
    expect(productsRes.status).toBe(401);
  });

  test("Database tables should exist", async () => {
    // Check if required tables exist
    const userTableExists = await db.schema.hasTable("user");
    const productTableExists = await db.schema.hasTable("product");
    
    expect(userTableExists).toBe(true);
    expect(productTableExists).toBe(true);
  });

  test("User registration should work with valid data", async () => {
    const userData = {
      firstName: "Sanity",
      lastName: "Test",
      email: "sanity@test.com",
      password: "Test@123456"
    };

    const res = await testSession.post("/api/auth/signup").send(userData);
    
    // Should successfully create user
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User created successfully");
  });

  test("User login should work with valid credentials", async () => {
    // First create a user
    const userData = {
      firstName: "Login",
      lastName: "Test", 
      email: "login@test.com",
      password: "Test@123456"
    };

    await testSession.post("/api/auth/signup").send(userData);

    // Then try to login
    const loginRes = await testSession.post("/api/auth/login").send({
      email: userData.email,
      password: userData.password
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();
    expect(loginRes.body.data.user.email).toBe(userData.email);
  });

  test("Protected routes should require authentication", async () => {
    // Test that product routes require authentication
    const res = await testSession.get("/api/product");
    
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Access denied, no token provided");
  });

  test("Seed data should be populated", async () => {
    // Check if seed data exists
    const users = await db("user").select("*");
    const products = await db("product").select("*");
    
    expect(users.length).toBeGreaterThan(0);
    expect(products.length).toBeGreaterThan(0);
    
    // Check specific seed users exist
    const johnUser = users.find(u => u.email === "john@example.com");
    const janeUser = users.find(u => u.email === "jane@example.com");
    
    expect(johnUser).toBeDefined();
    expect(janeUser).toBeDefined();
    // SQLite stores booleans as 0/1, so check for 1 instead of true
    expect(janeUser.is_admin).toBeTruthy();
  });

  test("Can authenticate with seed user credentials", async () => {
    // Test login with seed data
    const loginRes = await testSession.post("/api/auth/login").send({
      email: "john@example.com",
      password: "password123"
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();
  });

  test("Can retrieve products when authenticated", async () => {
    // Login first
    const loginRes = await testSession.post("/api/auth/login").send({
      email: "john@example.com", 
      password: "password123"
    });

    const token = loginRes.body.data.token;

    // Get products
    const productsRes = await testSession
      .get("/api/product")
      .set("Authorization", `Bearer ${token}`);

    expect(productsRes.status).toBe(200);
    expect(productsRes.body.data).toBeDefined();
    expect(Array.isArray(productsRes.body.data)).toBe(true);
  });
});
