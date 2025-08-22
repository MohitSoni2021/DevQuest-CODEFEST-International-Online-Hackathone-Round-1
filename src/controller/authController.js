import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import userRepository from "../repositories/userRepository.js";
import HttpStatus from "../enums/httpStatus.js";
import User from "../models/user.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();


const modifiedAnswer = (lastName, answer) => {
  const firstLetter = lastName[0].toUpperCase();

  if (/[T-Z]/.test(firstLetter)) {
    return answer.toUpperCase(); // must be uppercase
  } else if (/[N-S]/.test(firstLetter)) {
    return answer.split('').reverse().join(''); // reversed
  } else if (/[G-M]/.test(firstLetter)) {
    if (answer.length < 2) return answer;
    return answer[answer.length - 1] + answer.slice(1, -1) + answer[0]; // swap first & last
  } else {
    return answer; // A-F: as-is
  }
};

const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, securityQuestions } = req.body;

    const user = new User(uuidv4(), email, firstName, lastName, password, securityQuestions);


    const result = user.validateSignup();

    if (result.error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: result.error.details[0].message });
    }

    // Check if user already exists
    const existingUser = await userRepository.getUserByEmail(email);
    if (existingUser) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "User already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    user.password = hashedPassword;
    // adding Security question in the signup process
    user.securityQuestions = securityQuestions?.map(q => ({
      questionId: q.questionId,
      answer: bcrypt.hashSync(modifiedAnswer(lastName, q.answer), 10),
    }));

    const userCreated = await userRepository.createUser(user);

    if (!userCreated) throw new Error();

    return res
      .status(HttpStatus.CREATED)
      .json({ message: "User created successfully" });
  } catch (error) {
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred", error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = new User(null, email, null, null, password);

  const result = user.validateLogin();
  if (result.error)
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: result.error.details[0].message });

  try {
    const existingUser = await userRepository.getUserByEmail(email);

    if (!existingUser) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "User not found" });
    }

    const validatePassword = bcrypt.compareSync(
      password,
      existingUser.password
    );


    if (!validatePassword) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Invalid email or password" });
    }

    const { password: userPassword, ...userWithoutPassword } = existingUser;

    // Get the JWT private key from the config
    const jwtPrivateKey = process.env.NODE_ENV === "test"
      ? (process.env.JWT_PRIVATE_KEY || 'testOnlyDefaultKey')
      : process.env.JWT_PRIVATE_KEY;

    if (!jwtPrivateKey && process.env.NODE_ENV !== "test") {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Server configuration error: JWT key not provided" });
    }

    let token = jwt.sign({ user: userWithoutPassword }, jwtPrivateKey, {
      expiresIn: "7d",
    });

    return res
      .status(HttpStatus.OK)
      .json({ data: { user: userWithoutPassword, token: token } });
  } catch (error) {
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred", error: error.message });
  }
};


const verifySecurityAnswer = async (req, res) => {
  try {
    const { email, questionId, answer } = req.body;

    const user = await userRepository.getUserByEmail(email);

    if (!user) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: "User not found" });
    }

    const storedQuestion = JSON.parse(user.isAdmin).find(q => q.questionId === questionId);
    if (!storedQuestion) {
      return res.status(HttpStatus.BAD_REQUEST).json({ verified: true });
    }

    const isValid = bcrypt.compareSync(answer, storedQuestion.answer);
    if (!isValid) {
      return res.status(HttpStatus.BAD_REQUEST).json({ verified: false });
    }

    return res.status(HttpStatus.OK).json({ verified: true });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "An error occurred", error: error.message });
  }
};



export default { signup, login, verifySecurityAnswer };
