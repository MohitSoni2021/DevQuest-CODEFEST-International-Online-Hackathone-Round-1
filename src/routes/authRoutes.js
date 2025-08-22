import express from "express";
import authController from "../controller/authController.js";

const { signup, login, verifySecurityAnswer } = authController;

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-security-question", verifySecurityAnswer );

export default router;
