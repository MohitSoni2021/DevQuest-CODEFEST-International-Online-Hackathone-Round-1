import { v4 as uuidv4 } from "uuid";
import productRepository from "../repositories/productRepository.js";
import HttpStatus from "../enums/httpStatus.js";
import Product from "../models/product.js";

const createProduct = async (req, res) => {
  try {
    const { name, description, sku, price, stockQuantity, reorderLevel, category, supplierId } = req.body;
    const userId = req.user.id;
    
    // TODO: Implement SKU uniqueness check
    // Challenge: Check if SKU already exists before creating
    // Hint: Use productRepository.getProductBySku()
    
    const isProductSkuAvaliable = await productRepository.getProductBySku(sku);
    if(isProductSkuAvaliable != null) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "SKU already exists" });
    }
    
    const product = new Product(uuidv4(), name, description, sku, price, stockQuantity, reorderLevel, category, true, supplierId, userId);

    const result = product.validateCreate();
    if (result.error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: result.error.details[0].message });
    }

    // TODO: Create the product using repository
    const createdProduct = await productRepository.createProduct(product);
    if (!createdProduct) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Failed to create product" });
    }

    return res
      .status(HttpStatus.CREATED)
      .json({ message: "Product created successfully", data: createdProduct });
  } catch (error) {
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred", error: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const products = await productRepository.getProductsByUserId(userId);

    return res
      .status(HttpStatus.OK)
      .json({ data: products });
  } catch (error) {
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred", error: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await productRepository.getAllProducts();

    return res
      .status(HttpStatus.OK)
      .json({ data: products });
  } catch (error) {
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred", error: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const product = await productRepository.getProductById(id);
    if (!product) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "Product not found" });
    }

    // Check if product belongs to the authenticated user (only owners can modify)
    if (product.userId !== userId) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({ message: "Access denied" });
    }

    return res
      .status(HttpStatus.OK)
      .json({ data: product });
  } catch (error) {
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred", error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // First check if product exists and belongs to user
    const existingProduct = await productRepository.getProductById(id);
    if (!existingProduct) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "Product not found" });
    }

    if (existingProduct.userId !== userId) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({ message: "Access denied" });
    }

    // TODO: Implement SKU uniqueness check for updates
    // Challenge: If updating SKU, check it doesn't conflict with existing products
    // Hint: Only check if the new SKU is different from current SKU

    // Create product instance for validation
    const product = new Product(
      id, 
      updates.name, 
      updates.description, 
      updates.sku, 
      updates.price, 
      updates.stockQuantity, 
      updates.reorderLevel, 
      updates.category, 
      updates.isActive, 
      updates.supplierId, 
      userId
    );
    
    const result = product.validateUpdate();
    if (result.error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: result.error.details[0].message });
    }

    // TODO: Update the product using repository
    const updatedProduct = await productRepository.updateProduct(id, product);
    if (!updatedProduct) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Failed to update product" });
    }

    return res
      .status(HttpStatus.OK)
      .json({ message: "Product updated successfully", data: updatedProduct });
  } catch (error) {
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // First check if product exists and belongs to user
    const existingProduct = await productRepository.getProductById(id);
    if (!existingProduct) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "Product not found" });
    }

    if (existingProduct.userId !== userId) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({ message: "Access denied" });
    }

    const deletedProduct = await productRepository.deleteProduct(id);
    if (!deletedProduct) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Failed to delete product" });
    }

    return res
      .status(HttpStatus.OK)
      .json({ message: "Product deleted successfully" });
  } catch (error) {
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred", error: error.message });
  }
};

// Business logic endpoint: Get products that need reordering
const getProductsNeedingReorder = async (req, res) => {
  try {
    // TODO: Implement reorder detection endpoint
    // Challenge: Call the repository function and return proper response
    // Note: The repository function must respect user context
    // Only return products that belong to the authenticated user
    const userId = req.user.id;
    const products = await productRepository.getProductsNeedingReorder(userId);

    return res
      .status(HttpStatus.OK)
      .json({ 
        data: products,
        message: `Found ${products.length} products that need reordering`
      });
  } catch (error) {
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred", error: error.message });
  }
};

// Business logic endpoint: Update stock quantity (simulate stock movement)
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'
    const userId = req.user.id;

    // --- Input validation ---
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "quantity must be an integer" });
    }

    if (operation !== "add" && operation !== "subtract") {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Operation must be either 'add' or 'subtract'" });
    }

    // --- Fetch existing product ---
    const existingProduct = await productRepository.getProductById(id);
    if (!existingProduct) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "Product not found" });
    }

    // --- Check ownership ---
    if (existingProduct.userId !== userId) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({ message: "Access denied" });
    }

    // --- Calculate new stock quantity ---
    let newStockQuantity = existingProduct.stockQuantity;
    if (operation === "add") {
      newStockQuantity += quantity;
    } else if (operation === "subtract") {
      newStockQuantity -= quantity;
    }

    // --- Prevent negative stock ---
    if (newStockQuantity < 0) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Insufficient stock" });
    }

    // --- Update the product stock using repository ---
    const updatedProduct = await productRepository.updateProduct(id, {
      stockOperation: operation,
      quantity
    });

    if (!updatedProduct) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Failed to update stock" });
    }

    return res
      .status(HttpStatus.OK)
      .json({
        message: `Stock ${operation === 'add' ? 'added' : 'reduced'} successfully`,
        data: updatedProduct
      });
  } catch (error) {
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred", error: error.message });
  }
};


export default {
  createProduct,
  getProducts,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductsNeedingReorder,
  updateStock,
}; 