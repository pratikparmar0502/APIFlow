import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { User } from "../models/User";
import {
  hashPassword,
  comparePassword,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  sanitizeUser,
} from "../utils/auth";
import { requireAuth } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rateLimiter";
import { requireCsrfProtection } from "../middleware/csrf";

const router = Router();

const SignupSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  name: z.string().trim().max(100).optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be at most 128 characters"),
});

const LoginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").max(128),
});

// POST /api/v1/auth/signup
router.post("/signup", authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = SignupSchema.parse(req.body);
    const normalizedEmail = validated.email.toLowerCase();

    // Check for existing user with duplicate normalized email
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({
        code: "DUPLICATE_EMAIL",
        message: "An account with this email address already exists",
      });
      return;
    }

    const passwordHash = await hashPassword(validated.password);

    const user = new User({
      email: normalizedEmail,
      name: validated.name || "APIFlow User",
      passwordHash,
      status: "active",
    });

    await user.save();

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.status(201).json({
      user: sanitizeUser(user),
      token,
      message: "Account created successfully",
    });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({
        code: "DUPLICATE_EMAIL",
        message: "An account with this email address already exists",
      });
      return;
    }
    next(err);
  }
});

// POST /api/v1/auth/login
router.post("/login", authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const normalizedEmail = validated.email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Generic invalid credentials message to prevent email enumeration
      res.status(401).json({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email address or password",
      });
      return;
    }

    if (user.status === "disabled") {
      res.status(403).json({
        code: "ACCOUNT_DISABLED",
        message: "This account has been disabled. Please contact support.",
      });
      return;
    }

    const isMatch = await comparePassword(validated.password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email address or password",
      });
      return;
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      user: sanitizeUser(user),
      token,
      message: "Logged in successfully",
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
router.post("/logout", requireCsrfProtection, (req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({
    message: "Logged out successfully",
  });
});

// GET /api/v1/auth/me
router.get("/me", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "User account not found",
      });
      return;
    }

    res.json({
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
