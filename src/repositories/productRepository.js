import knex_db from "../../db/db-config.js";
import Product from "../models/product.js";

const createProduct = async (product) => {
  const { id, name, description, sku, price, stockQuantity, reorderLevel, category, supplierId, userId } = product;
  try {
    // TODO: Implement product creation
    // Hint: Handle supplierId properly to avoid SQL binding errors
    // Hint: Use raw SQL INSERT with RETURNING clause

    const result = await knex_db.raw(
      `INSERT INTO product 
        (id, name, description, sku, price, stock_quantity, reorder_level, category, supplier_id, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        id,
        name,
        description,
        sku,
        price,
        stockQuantity,
        reorderLevel,
        category,
        supplierId || null, // handle supplierId properly
        userId
      ]
    );

    if (result.length > 0) {
      const createdProduct = new Product(
        result[0].id,
        result[0].name,
        result[0].description,
        result[0].sku,
        result[0].price,
        result[0].stock_quantity,
        result[0].reorder_level,
        result[0].category,
        result[0].is_active,
        result[0].supplier_id,
        result[0].user_id
      );
      return createdProduct;
    }

    return null; // TODO: Return created product instance
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getProductsByUserId = async (userId) => {
  try {
    const result = await knex_db.raw(
      "SELECT * FROM product WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    return result.map((product) => new Product(
      product.id,
      product.name,
      product.description,
      product.sku,
      product.price,
      product.stock_quantity,
      product.reorder_level,
      product.category,
      product.is_active,
      product.supplier_id,
      product.user_id
    ));
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getAllProducts = async () => {
  try {
    const result = await knex_db.raw(
      "SELECT * FROM product WHERE is_active = true ORDER BY created_at DESC"
    );

    return result.map((product) => new Product(
      product.id,
      product.name,
      product.description,
      product.sku,
      product.price,
      product.stock_quantity,
      product.reorder_level,
      product.category,
      product.is_active,
      product.supplier_id,
      product.user_id
    ));
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getProductById = async (id) => {
  try {
    // TODO: Implement product retrieval by ID
    // Hint: Use SELECT query with WHERE clause on id column
    // Hint: Return Product instance if found, null otherwise

    const result = await knex_db.raw(
      "SELECT * FROM product WHERE id = ? LIMIT 1",
      [id]
    );

    if (result.length > 0) {
      const product = result[0];
      return new Product(
        product.id,
        product.name,
        product.description,
        product.sku,
        product.price,
        product.stock_quantity,
        product.reorder_level,
        product.category,
        product.is_active,
        product.supplier_id,
        product.user_id
      );
    }
    
    return null; // TODO: Return product if found
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getProductBySku = async (sku) => {
  try {
    // TODO: Implement SKU-based product retrieval
    // Hint: This is crucial for SKU uniqueness validation
    // Hint: Use SELECT query with WHERE clause on sku column
    const result = await knex_db.raw(
      "SELECT * FROM product WHERE LOWER(sku) = LOWER(?) LIMIT 1",
      [sku]
    );

    if (result.length > 0) {
      const product = result[0];
      return new Product(
        product.id,
        product.name,
        product.description,
        product.sku,
        product.price,
        product.stock_quantity,
        product.reorder_level,
        product.category,
        product.is_active,
        product.supplier_id,
        product.user_id
      );
    }
    
    return null; // TODO: Return product if found, null otherwise
  } catch (error) {
    console.error(error);
    return null;
  }
};

const updateProduct = async (id, updates) => {
try {
// Fetch the existing product first (needed for stock operations)
const existingResult = await knex_db.raw("SELECT * FROM product WHERE id = ?", [id]);
if (existingResult.length === 0) {
return null; // Product not found
}
const existingProduct = existingResult[0];


const validUpdates = {};

// --- Handle stock operations separately ---
if (updates.stockOperation) {
  const { stockOperation, quantity } = updates;

  // Validate operation type
  if (stockOperation !== "add" && stockOperation !== "subtract") {
    throw new Error("Invalid stock operation. Must be 'add' or 'subtract'.");
  }

  // Validate quantity: must be integer and > 0
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive integer (no decimals or zero allowed).");
  }

  // Calculate new stock quantity
  let newStock = existingProduct.stock_quantity;
  if (stockOperation === "add") {
    newStock += quantity;
  } else if (stockOperation === "subtract") {
    newStock -= quantity;
  }

  // Prevent negative stock
  if (newStock < 0) {
    throw new Error("Stock quantity cannot be negative.");
  }

  validUpdates.stockQuantity = newStock;
}

// --- Handle other dynamic updates (ignore stockOperation & quantity keys) ---
for (const [key, value] of Object.entries(updates)) {
  if (value !== undefined && key !== "stockOperation" && key !== "quantity") {
    validUpdates[key] = value;
  }
}

// If no valid updates, return null
if (Object.keys(validUpdates).length === 0) {
  return null;
}

// Map field names to database column names
const fieldToColumnMap = {
  name: "name",
  description: "description",
  sku: "sku",
  price: "price",
  stockQuantity: "stock_quantity",
  reorderLevel: "reorder_level",
  category: "category",
  isActive: "is_active",
  supplierId: "supplier_id",
  userId: "user_id"
};

// Build SET clause dynamically
const setClauses = [];
const values = [];
for (const [key, value] of Object.entries(validUpdates)) {
  if (fieldToColumnMap[key]) {
    setClauses.push(`${fieldToColumnMap[key]} = ?`);
    values.push(value);
  }
}

if (setClauses.length === 0) {
  return null;
}

// Add id for WHERE condition
values.push(id);

// Run update query
const query = `UPDATE product SET ${setClauses.join(", ")} WHERE id = ? RETURNING *`;
const result = await knex_db.raw(query, values);

if (result.length > 0) {
  const product = result[0];
  return new Product(
    product.id,
    product.name,
    product.description,
    product.sku,
    product.price,
    product.stock_quantity,
    product.reorder_level,
    product.category,
    product.is_active,
    product.supplier_id,
    product.user_id
  );
}

return null;



} catch (error) {
console.error(error);
throw error; // rethrow so controllers can handle validation errors
}
};

const deleteProduct = async (id) => {
  try {
    const result = await knex_db.raw(
      "DELETE FROM product WHERE id = ? RETURNING *",
      [id]
    );

    if (result.length > 0) {
      const product = result[0];
      return new Product(
        product.id,
        product.name,
        product.description,
        product.sku,
        product.price,
        product.stock_quantity,
        product.reorder_level,
        product.category,
        product.is_active,
        product.supplier_id,
        product.user_id
      );
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Business logic: Get products that need reordering
const getProductsNeedingReorder = async (userId) => {
  try {
    // TODO: Implement reorder level detection
    // Challenge: Query products where stock_quantity <= reorder_level
    // Challenge: Only return active products
    // Advanced Challenge: Handle test isolation (filter by appropriate user context)
    // Advanced Challenge: Sort results by priority (lowest stock to reorder ratio first)
    
    // HINT: Use the following SQL pattern:
    // SELECT * FROM product 
    // WHERE user_id = ? AND stock_quantity <= reorder_level AND is_active = true
    // ORDER BY (stock_quantity * 1.0 / reorder_level) ASC
    const query = `
      SELECT * FROM product
      WHERE user_id = ? 
        AND is_active = true
        AND stock_quantity <= reorder_level
      ORDER BY (stock_quantity * 1.0 / reorder_level) ASC
    `;

    const result = await knex_db.raw(query, [userId]);

    return result.map((product) => {
      return {
        ...product,
        stockQuantity: product.stock_quantity,
        reorderLevel: product.reorder_level,
      };
    });

  } catch (error) {
    console.error(error);
    return [];
  }
};

export default {
  createProduct,
  getProductsByUserId,
  getAllProducts,
  getProductById,
  getProductBySku,
  updateProduct,
  deleteProduct,
  getProductsNeedingReorder,
}; 