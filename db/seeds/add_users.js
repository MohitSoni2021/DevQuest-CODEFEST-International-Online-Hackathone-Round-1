import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Clear existing entries
  await knex("product").del();
  await knex("user").del();

  // Create sample users
  const userId1 = uuidv4();
  const userId2 = uuidv4();

  const hashedPassword = bcrypt.hashSync("password123", 10);

  // Insert users
  await knex("user").insert([
    {
      id: userId1,
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      password: hashedPassword,
      is_admin: false,
    },
    {
      id: userId2,
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
      password: hashedPassword,
      is_admin: true,
    },
  ]);

  // Insert sample products
  await knex("product").insert([
    {
      id: uuidv4(),
      name: "Wireless Bluetooth Headphones",
      description: "High-quality wireless headphones with noise cancellation",
      sku: "WBH-001",
      price: 99.99,
      stock_quantity: 50,
      reorder_level: 10,
      category: "electronics",
      is_active: true,
      supplier_id: null,
      user_id: userId1,
    },
    {
      id: uuidv4(),
      name: "Cotton T-Shirt",
      description: "Comfortable 100% cotton t-shirt",
      sku: "CTS-002",
      price: 19.99,
      stock_quantity: 5, // Low stock to trigger reorder
      reorder_level: 15,
      category: "clothing",
      is_active: true,
      supplier_id: null,
      user_id: userId1,
    },
    {
      id: uuidv4(),
      name: "Programming Fundamentals Book",
      description: "Learn programming fundamentals with practical examples",
      sku: "PFB-003",
      price: 45.50,
      stock_quantity: 25,
      reorder_level: 5,
      category: "books",
      is_active: true,
      supplier_id: null,
      user_id: userId2,
    },
    {
      id: uuidv4(),
      name: "Gaming Mouse",
      description: "High precision gaming mouse with RGB lighting",
      sku: "GM-004",
      price: 79.99,
      stock_quantity: 8, // Low stock to trigger reorder
      reorder_level: 10,
      category: "electronics",
      is_active: true,
      supplier_id: null,
      user_id: userId2,
    },
    {
      id: uuidv4(),
      name: "Office Chair",
      description: "Ergonomic office chair with lumbar support",
      sku: "OC-005",
      price: 299.99,
      stock_quantity: 12,
      reorder_level: 3,
      category: "home",
      is_active: true,
      supplier_id: null,
      user_id: userId1,
    }
  ]);
}

