import { v4 as uuidv4 } from "uuid";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Clear existing entries
  await knex("product").del();

  // Get the first user to assign products to
  const users = await knex("user").select("id").limit(1);
  
  if (users.length === 0) {
    console.log("No users found to assign products to");
    return;
  }
  
  const userId = users[0].id;

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
      user_id: userId
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
      user_id: userId
    },
    {
      id: uuidv4(),
      name: "Gaming Mouse",
      description: "High DPI gaming mouse with programmable buttons",
      sku: "GM-PRO-X",
      price: 79.99,
      stock_quantity: 8,
      reorder_level: 10,
      category: "electronics",
      is_active: true,
      user_id: userId
    }
  ]);
}
