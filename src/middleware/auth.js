import jwt from "jsonwebtoken";
import HttpStatus from "../enums/httpStatus.js";

function auth(req, res, next) {
  let token = req.header("Authorization");
  
  if (!token)
    return res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ message: "Access denied, no token provided" });

  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length).trimLeft();
  }

  try {
    // In test environment, use a default key if not provided
    const jwtKey = process.env.NODE_ENV === "test" 
      ? (process.env.JWT_PRIVATE_KEY || 'testOnlyDefaultKey')
      : process.env.JWT_PRIVATE_KEY;
      
    if (!jwtKey) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Server configuration error: JWT key not provided" });
    }
    
    const decode = jwt.verify(token, jwtKey);
    req.user = decode.user;
    // temperary used
    // req.user = {id: "6d7f4c89-99e6-4092-8d84-f401130b5674"}; // for the testing purpose to test api

    next();
  } catch (ex) {
    res.status(HttpStatus.BAD_REQUEST).json({ message: "Invalid token" });
  }
}

export default auth;