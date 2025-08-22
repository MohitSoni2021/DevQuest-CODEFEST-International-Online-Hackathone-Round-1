import { JSDOM } from "jsdom";
import fs from "fs";
import app from "../src/server.js";
import db from "../db/db-config.js";
import testBase from "./testBase.js";
import { expect, test, describe, beforeAll, afterAll, afterEach } from "vitest";
import HttpStatus from "../src/enums/httpStatus.js";

let testSession = null;

// Setup and teardown
beforeAll(async () => {
	testSession = testBase.createSuperTestSession(app);
	await testBase.resetDatabase(db);
});
afterEach(async () => {
	await testBase.resetDatabase(db);
});
afterAll((done) => {
	app.close(done);
});

describe("InventoryMaster Challenge Tests", () => {
	// Challenge a
	test("Challenge a - Homepage title should be 'InventoryMaster'", async () => {
		const markup = fs.readFileSync("./client/index.html").toString();
		const dom = new JSDOM(markup);
		const document = dom.window.document;
		expect(document.title).toBe("InventoryMaster");
	});

	// Challenge b
	test("Challenge b - Signup and login links should be properly configured", async () => {
		const markup = fs.readFileSync("./client/index.html").toString();
		const dom = new JSDOM(markup);
		const document = dom.window.document;

		const signUpLink = document.querySelector("#signUpLink");
		expect(signUpLink).not.toBeNull();
		expect(signUpLink.getAttribute("href")).toBe("signup.html");

		const loginLink = document.querySelector("#loginLink");
		expect(loginLink).not.toBeNull();
		expect(loginLink.getAttribute("href")).toBe("login.html");

		const btnGetstarted = document.querySelector(".btnGetstarted");
		expect(btnGetstarted).not.toBeNull();
		expect(btnGetstarted.getAttribute("href")).toBe("login.html");
	});

	// Challenge c
	test("Challenge c - Product model should enforce SKU uniqueness validation", async () => {
		
		const userData = {
			firstName: "Test",
			lastName: "User",
			email: "test@example.com",
			password: "Test@123456"
		};

		await testSession.post("/api/auth/signup").send(userData);
		const loginRes = await testSession.post("/api/auth/login").send({
			email: userData.email,
			password: userData.password
		});

		const token = loginRes.body.data.token;

		// Create first product
		const product1 = {
			name: "Test Product 1",
			sku: "TEST-001",
			description: "First test product",
			price: 99.99,
			stockQuantity: 50,
			reorderLevel: 10,
			category: "electronics"
		};

		const res1 = await testSession
			.post("/api/product")
			.set("Authorization", `Bearer ${token}`)
			.send(product1);

		expect(res1.status).toBe(HttpStatus.CREATED);

		// Try to create second product with same SKU - should fail
		const product2 = {
			name: "Test Product 2",
			sku: "TEST-001", // Same SKU as product1
			description: "Second test product",
			price: 79.99,
			stockQuantity: 30,
			reorderLevel: 5,
			category: "books"
		};

		const res2 = await testSession
			.post("/api/product")
			.set("Authorization", `Bearer ${token}`)
			.send(product2);

		expect(res2.status).toBe(HttpStatus.BAD_REQUEST);
		expect(res2.body.message).toContain("SKU already exists");
    
		// Also test case-insensitive uniqueness
		const product3 = {
			name: "Test Product 3",
			sku: "test-001", // Same as TEST-001 but different case
			description: "Third test product",
			price: 49.99,
			stockQuantity: 20,
			reorderLevel: 5,
			category: "electronics"
		};
    
		const res3 = await testSession
			.post("/api/product")
			.set("Authorization", `Bearer ${token}`)
			.send(product3);
      
		expect(res3.status).toBe(HttpStatus.BAD_REQUEST);
		expect(res3.body.message).toContain("SKU already exists");
	});

	// Challenge d
	test("Challenge d - Stock update operation should maintain data integrity", async () => {
		
		const userData = {
			firstName: "Test",
			lastName: "User",
			email: "test@example.com",
			password: "Test@123456"
		};

		await testSession.post("/api/auth/signup").send(userData);
		const loginRes = await testSession.post("/api/auth/login").send({
			email: userData.email,
			password: userData.password
		});

		const token = loginRes.body.data.token;

		// Create a product
		const product = {
			name: "Test Product",
			sku: "TEST-0012",
			description: "Test product for stock operations",
			price: 99.99,
			stockQuantity: 100,
			reorderLevel: 10,
			category: "electronics"
		};

		const createRes = await testSession
			.post("/api/product")
			.set("Authorization", `Bearer ${token}`)
			.send(product);

		const productId = createRes.body.data.id;

		// Test adding stock
		const addStockRes = await testSession
			.put(`/api/product/${productId}/stock`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				quantity: 50,
				operation: "add"
			});

		expect(addStockRes.status).toBe(HttpStatus.OK);
		expect(addStockRes.body.data.stockQuantity).toBe(150);

		// Test reducing stock
		const reduceStockRes = await testSession
			.put(`/api/product/${productId}/stock`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				quantity: 25,
				operation: "subtract"
			});

		expect(reduceStockRes.status).toBe(HttpStatus.OK);
		expect(reduceStockRes.body.data.stockQuantity).toBe(125);

		// Test preventing negative stock
		const negativeStockRes = await testSession
			.put(`/api/product/${productId}/stock`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				quantity: 200,
				operation: "subtract"
			});

		expect(negativeStockRes.status).toBe(HttpStatus.BAD_REQUEST);
		expect(negativeStockRes.body.message).toContain("Insufficient stock");
    
		// Test decimal validation
		const decimalStockRes = await testSession
			.put(`/api/product/${productId}/stock`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				quantity: 10.5, // Decimal value should be rejected
				operation: "add"
			});
      
		expect(decimalStockRes.status).toBe(HttpStatus.BAD_REQUEST);
		expect(decimalStockRes.body.message).toContain("quantity must be an integer");
    
		// Test zero validation
		const zeroStockRes = await testSession
			.put(`/api/product/${productId}/stock`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				quantity: 0,
				operation: "add"
			});
      
		expect(zeroStockRes.status).toBe(HttpStatus.BAD_REQUEST);
	});

	// Challenge e
	test("Challenge e - Reorder level detection should work correctly", async () => {
		
		const userData = {
			firstName: "Test",
			lastName: "User",
			email: "test@example.com",
			password: "Test@123456"
		};

		await testSession.post("/api/auth/signup").send(userData);
		const loginRes = await testSession.post("/api/auth/login").send({
			email: userData.email,
			password: userData.password
		});

		const token = loginRes.body.data.token;
    
		// Create a second user to test isolation
		const userData2 = {
			firstName: "Second",
			lastName: "User",
			email: "second@example.com",
			password: "Test@123456"
		};
    
		await testSession.post("/api/auth/signup").send(userData2);
		const loginRes2 = await testSession.post("/api/auth/login").send({
			email: userData2.email,
			password: userData2.password
		});
    
		const token2 = loginRes2.body.data.token;

		// Create products with different stock levels for first user
		const products = [
			{
				name: "High Stock Product",
				sku: "HIGH-001",
				description: "Product with high stock",
				price: 50.00,
				stockQuantity: 100,
				reorderLevel: 20,
				category: "electronics"
			},
			{
				name: "Low Stock Product",
				sku: "LOW-001",
				description: "Product with low stock",
				price: 30.00,
				stockQuantity: 5, // Below reorder level
				reorderLevel: 15,
				category: "books"
			},
			{
				name: "Critical Stock Product",
				sku: "CRIT-001",
				description: "Product with critical stock",
				price: 75.00,
				stockQuantity: 2, // Well below reorder level
				reorderLevel: 10,
				category: "clothing"
			}
		];

		// Create all products for first user
		for (const product of products) {
			await testSession
				.post("/api/product")
				.set("Authorization", `Bearer ${token}`)
				.send(product);
		}
    
		// Create a low stock product for the second user (to test isolation)
		const secondUserProduct = {
			name: "Second User Low Stock",
			sku: "2USER-001",
			description: "This belongs to second user",
			price: 45.00,
			stockQuantity: 3, // Below reorder level
			reorderLevel: 10,
			category: "sports"
		};
    
		await testSession
			.post("/api/product")
			.set("Authorization", `Bearer ${token2}`)
			.send(secondUserProduct);

		// Test reorder detection endpoint for first user
		const reorderRes = await testSession
			.get("/api/product/reorder")
			.set("Authorization", `Bearer ${token}`);

		expect(reorderRes.status).toBe(HttpStatus.OK);
		expect(reorderRes.body.data).toHaveLength(2); // Should return 2 products needing reorder
    
		// Verify that only low stock products are returned
		const reorderProducts = reorderRes.body.data;
		reorderProducts.forEach(product => {
			expect(product.stockQuantity).toBeLessThanOrEqual(product.reorderLevel);
		});

		// Verify specific products are in the reorder list
		const skus = reorderProducts.map(p => p.sku);
		expect(skus).toContain("LOW-001");
		expect(skus).toContain("CRIT-001");
		expect(skus).not.toContain("HIGH-001");
		expect(skus).not.toContain("2USER-001"); // Should not contain second user's product
    
		// Test reorder detection for second user
		const reorderRes2 = await testSession
			.get("/api/product/reorder")
			.set("Authorization", `Bearer ${token2}`);
      
		expect(reorderRes2.status).toBe(HttpStatus.OK);
		expect(reorderRes2.body.data).toHaveLength(1); // Should return just 1 product
		expect(reorderRes2.body.data[0].sku).toBe("2USER-001"); // Only this user's product
	});

	// Challenge f
	test("Challenge f - User can create and manage products with comprehensive validation", async () => {
		
		const userData = {
			firstName: "Test",
			lastName: "User",
			email: "test@example.com",
			password: "Test@123456"
		};

		await testSession.post("/api/auth/signup").send(userData);
		const loginRes = await testSession.post("/api/auth/login").send({
			email: userData.email,
			password: userData.password
		});

		const token = loginRes.body.data.token;
    
		// Create second user to test access control
		const userData2 = {
			firstName: "Second",
			lastName: "User",
			email: "second@example.com",
			password: "Test@123456"
		};

		await testSession.post("/api/auth/signup").send(userData2);
		const loginRes2 = await testSession.post("/api/auth/login").send({
			email: userData2.email,
			password: userData2.password
		});

		const token2 = loginRes2.body.data.token;

		// Test product creation with valid data
		const validProduct = {
			name: "Gaming Laptop",
			sku: "GL-2024-001",
			description: "High-performance gaming laptop with RGB keyboard",
			price: 1299.99,
			stockQuantity: 25,
			reorderLevel: 5,
			category: "electronics"
		};

		const createRes = await testSession
			.post("/api/product")
			.set("Authorization", `Bearer ${token}`)
			.send(validProduct);

		expect(createRes.status).toBe(HttpStatus.CREATED);
		expect(createRes.body.data.name).toBe(validProduct.name);
		expect(createRes.body.data.sku).toBe(validProduct.sku);
		expect(createRes.body.data.price).toBe(validProduct.price);

		const productId = createRes.body.data.id;

		// Test retrieving the product
		const getRes = await testSession
			.get(`/api/product/${productId}`)
			.set("Authorization", `Bearer ${token}`);

		expect(getRes.status).toBe(HttpStatus.OK);
		expect(getRes.body.data.name).toBe(validProduct.name);
    
		// Test accessing another user's product should fail (access control)
		const unauthorizedGetRes = await testSession
			.get(`/api/product/${productId}`)
			.set("Authorization", `Bearer ${token2}`);
      
		expect(unauthorizedGetRes.status).toBe(HttpStatus.FORBIDDEN);

		// Test updating the product
		const updateData = {
			name: "Updated Gaming Laptop",
			price: 1199.99,
			stockQuantity: 30,
			supplierId: "supplier-123" // Adding supplier ID to test optional field handling
		};

		const updateRes = await testSession
			.put(`/api/product/${productId}`)
			.set("Authorization", `Bearer ${token}`)
			.send(updateData);

		expect(updateRes.status).toBe(HttpStatus.OK);
		expect(updateRes.body.data.name).toBe(updateData.name);
		expect(updateRes.body.data.price).toBe(updateData.price);
		expect(updateRes.body.data.supplierId).toBe(updateData.supplierId);

		// Test validation - invalid price
		const invalidProduct = {
			name: "Invalid Product",
			sku: "INVALID-001",
			price: -50, // Invalid negative price
			stockQuantity: 10,
			reorderLevel: 5,
			category: "electronics"
		};

		const invalidRes = await testSession
			.post("/api/product")
			.set("Authorization", `Bearer ${token}`)
			.send(invalidProduct);

		expect(invalidRes.status).toBe(HttpStatus.BAD_REQUEST);
    
		// Test validation - invalid category
		const invalidCategoryProduct = {
			name: "Invalid Category",
			sku: "CAT-001",
			price: 50,
			category: "invalid-category" // Not in allowed categories
		};

		const invalidCatRes = await testSession
			.post("/api/product")
			.set("Authorization", `Bearer ${token}`)
			.send(invalidCategoryProduct);

		expect(invalidCatRes.status).toBe(HttpStatus.BAD_REQUEST);
    
		// Test unauthorized update attempt should fail
		const unauthorizedUpdateRes = await testSession
			.put(`/api/product/${productId}`)
			.set("Authorization", `Bearer ${token2}`)
			.send(updateData);
      
		expect(unauthorizedUpdateRes.status).toBe(HttpStatus.FORBIDDEN);

		// Test deleting the product
		const deleteRes = await testSession
			.delete(`/api/product/${productId}`)
			.set("Authorization", `Bearer ${token}`);

		expect(deleteRes.status).toBe(HttpStatus.OK);

		// Verify product is deleted
		const getDeletedRes = await testSession
			.get(`/api/product/${productId}`)
			.set("Authorization", `Bearer ${token}`);

		expect(getDeletedRes.status).toBe(HttpStatus.NOT_FOUND);
	});

	// Challenge g
	test("Challenge g - Password complexity validation for user signup", async () => {
		
		const shortPasswordUser = {
			firstName: "Test",
			lastName: "User",
			email: "test-short@example.com",
			password: "Abc1!" // Only 5 chars
		};
    
		const shortRes = await testSession
			.post("/api/auth/signup")
			.send(shortPasswordUser);
      
		expect(shortRes.status).toBe(HttpStatus.BAD_REQUEST);
		expect(shortRes.body.message).toContain("length");
    
		// Test case 2: Password without uppercase
		const noUpperUser = {
			firstName: "Test",
			lastName: "User",
			email: "test-noupper@example.com",
			password: "password123!" // No uppercase
		};
    
		const noUpperRes = await testSession
			.post("/api/auth/signup")
			.send(noUpperUser);
      
		expect(noUpperRes.status).toBe(HttpStatus.BAD_REQUEST);
		expect(noUpperRes.body.message).toContain("uppercase");
    
		// Test case 3: Password without lowercase
		const noLowerUser = {
			firstName: "Test",
			lastName: "User",
			email: "test-nolower@example.com",
			password: "PASSWORD123!" // No lowercase
		};
    
		const noLowerRes = await testSession
			.post("/api/auth/signup")
			.send(noLowerUser);
      
		expect(noLowerRes.status).toBe(HttpStatus.BAD_REQUEST);
		expect(noLowerRes.body.message).toContain("lowercase");
    
		// Test case 4: Password without number
		const noNumberUser = {
			firstName: "Test",
			lastName: "User",
			email: "test-nonumber@example.com",
			password: "Password!" // No number
		};
    
		const noNumberRes = await testSession
			.post("/api/auth/signup")
			.send(noNumberUser);
      
		expect(noNumberRes.status).toBe(HttpStatus.BAD_REQUEST);
		expect(noNumberRes.body.message).toContain("number");
    
		// Test case 5: Password without special character
		const noSpecialUser = {
			firstName: "Test",
			lastName: "User",
			email: "test-nospecial@example.com",
			password: "Password123" // No special character
		};
    
		const noSpecialRes = await testSession
			.post("/api/auth/signup")
			.send(noSpecialUser);
      
		expect(noSpecialRes.status).toBe(HttpStatus.BAD_REQUEST);
		expect(noSpecialRes.body.message).toContain("special");
    
		// Test case 6: Valid password should pass
		const validUser = {
			firstName: "Test",
			lastName: "User",
			email: "test-valid@example.com",
			password: "Password123!" // Valid password
		};
    
		const validRes = await testSession
			.post("/api/auth/signup")
			.send(validUser);
      
		expect(validRes.status).toBe(HttpStatus.CREATED);
		expect(validRes.body.message).toContain("successfully");
	});

	// Challenge h
	test("Challenge h - Smart Security Question System", async () => {
		
		const userData = {
			firstName: "Security",
			lastName: "Tester",
			email: "security@example.com",
			password: "Password123!",
			securityQuestions: [
				{ 
					questionId: "color", 
					answer: "blue" 
				},
				{ 
					questionId: "hometown", 
					answer: "chicago" 
				},
				{ 
					questionId: "pet", 
					answer: "rover" 
				}
			]
		};
    
		// Register user with security questions
		const signupRes = await testSession
			.post("/api/auth/signup")
			.send(userData);
      
		expect(signupRes.status).toBe(HttpStatus.CREATED);
    
		// Test the security question verification endpoint
		// The twist: Answer verification should apply a special rule based on user's last name:
		// If last name starts with T-Z: answers should be in UPPERCASE
		// If last name starts with N-S: answers should be reversed
		// If last name starts with G-M: answers should have first and last letter swapped
		// If last name starts with A-F: answers should be used as-is
    
		// For "Tester" (T-Z group), answers should be uppercase
		const verifyRes = await testSession
			.post("/api/auth/verify-security-question")
			.send({
				email: "security@example.com",
				questionId: "color",
				answer: "BLUE" // Uppercase because last name "Tester" starts with T
			});
      
		expect(verifyRes.status).toBe(HttpStatus.OK);
		expect(verifyRes.body.verified).toBe(true);
    
		// Test with incorrect transformation
		const failedRes = await testSession
			.post("/api/auth/verify-security-question")
			.send({
				email: "security@example.com",
				questionId: "color",
				answer: "blue" // Should be uppercase
			});
			
		expect(failedRes.status).toBe(HttpStatus.BAD_REQUEST);
		expect(failedRes.body.verified).toBe(false);
    
		// Test with another user in different category
		const userData2 = {
			firstName: "Another",
			lastName: "Person", // P is in N-S group, so answers should be reversed
			email: "person@example.com",
			password: "Password123!",
			securityQuestions: [
				{ 
					questionId: "movie", 
					answer: "titanic" 
				}
			]
		};
    
		const signup2Res = await testSession
			.post("/api/auth/signup")
			.send(userData2);
      
		expect(signup2Res.status).toBe(HttpStatus.CREATED);
    
		// For "Person" (N-S group), answers should be reversed
		const verify2Res = await testSession
			.post("/api/auth/verify-security-question")
			.send({
				email: "person@example.com",
				questionId: "movie",
				answer: "cinatit" // Reversed from "titanic"
			});
      
		expect(verify2Res.status).toBe(HttpStatus.OK);
		expect(verify2Res.body.verified).toBe(true);
	});
});
