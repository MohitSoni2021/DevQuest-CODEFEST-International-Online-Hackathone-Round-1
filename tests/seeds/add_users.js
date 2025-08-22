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

  // Create test users
  const johnId = uuidv4();
  const janeId = uuidv4();
  const hashedPassword = bcrypt.hashSync("password123", 10);

  await knex("user").insert([
    {
      id: johnId,
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      password: hashedPassword,
      is_admin: false,
    },
    {
      id: janeId,
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      password: hashedPassword,
      is_admin: true,
    }
  ]);
  
  // Add sample products
  await knex("product").insert([
    {
      id: uuidv4(),
      name: "Wireless Headphones",
      description: "High-quality wireless headphones with noise cancellation",
      sku: "WH-1000XM4",
      price: 299.99,
      stock_quantity: 50,
      reorder_level: 10,
      category: "electronics",
      is_active: true,
      user_id: johnId
    },
    {
      id: uuidv4(),
      name: "Cotton T-Shirt",
      description: "100% cotton premium t-shirt",
      sku: "TS-COTTON-L",
      price: 24.99,
      stock_quantity: 5,
      reorder_level: 10,
      category: "clothing",
      is_active: true,
      user_id: janeId
    }
  ]);
}

