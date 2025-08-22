import express from "express";
import productController from "../controller/productController.js";

const { 
  createProduct, 
  getProducts, 
  getAllProducts,
  getProduct, 
  updateProduct, 
  deleteProduct,
  getProductsNeedingReorder,
  updateStock 
} = productController;

const router = express.Router();

router.post("/", createProduct);
router.get("/", getProducts);
router.get("/all", getAllProducts);
router.get("/reorder", getProductsNeedingReorder);
router.get("/:id", getProduct);
router.put("/:id", updateProduct);
router.put("/:id/stock", updateStock);
router.delete("/:id", deleteProduct);

export default router; 