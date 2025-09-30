import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { loginSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    adminId?: string;
    adminUsername?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.adminId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const admin = await storage.validateAdminCredentials(username, password);
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.adminId = admin.id;
      req.session.adminUsername = admin.username;

      res.json({ 
        message: "Login successful", 
        admin: { 
          id: admin.id, 
          username: admin.username 
        } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const admin = await storage.getAdmin(req.session.adminId!);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      
      res.json({ 
        admin: { 
          id: admin.id, 
          username: admin.username,
          balance: (typeof admin.balance === 'string') ? admin.balance : String(admin.balance ?? '0')
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create transaction (distribute currency)
  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      
      const transaction = await storage.createTransaction({
        ...transactionData,
        adminId: req.session.adminId!,
        adminUsername: req.session.adminUsername!,
      });

      res.json({ 
        message: "Distribution successful", 
        transaction 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get transactions with pagination
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const transactions = await storage.getTransactions(limit, offset);
      const total = await storage.getTransactionCount();
      
      res.json({ 
        transactions, 
        total,
        limit,
        offset 
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get transactions by UID
  app.get("/api/transactions/user/:uid", requireAuth, async (req, res) => {
    try {
      const { uid } = req.params;
      const transactions = await storage.getTransactionsByUID(uid);
      
      res.json({ transactions });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
