import { type Admin, type InsertAdmin, type Transaction, type InsertTransaction } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // Admin methods
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  validateAdminCredentials(username: string, password: string): Promise<Admin | null>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction & { adminId: string; adminUsername: string }): Promise<Transaction>;
  getTransactions(limit?: number, offset?: number): Promise<Transaction[]>;
  getTransactionsByUID(userUID: string): Promise<Transaction[]>;
  getTransactionCount(): Promise<number>;
}

export class MemStorage implements IStorage {
  private admins: Map<string, Admin>;
  private adminsByUsername: Map<string, Admin>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.admins = new Map();
    this.adminsByUsername = new Map();
    this.transactions = new Map();
    
    // Create default admin user
    this.initializeDefaultAdmin();
  }

  private async initializeDefaultAdmin() {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const defaultAdmin: Admin = {
      id: randomUUID(),
      username: "admin",
      password: hashedPassword,
      isActive: true,
      balance: '786403297865',
    };
    
    this.admins.set(defaultAdmin.id, defaultAdmin);
    this.adminsByUsername.set(defaultAdmin.username, defaultAdmin);
  }

  async getAdmin(id: string): Promise<Admin | undefined> {
    return this.admins.get(id);
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return this.adminsByUsername.get(username);
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertAdmin.password, 10);
    const admin: Admin = { 
      ...insertAdmin, 
      id, 
      password: hashedPassword,
      isActive: true,
      balance: '786403297865',
    };
    
    this.admins.set(id, admin);
    this.adminsByUsername.set(admin.username, admin);
    return admin;
  }

  async validateAdminCredentials(username: string, password: string): Promise<Admin | null> {
    const admin = await this.getAdminByUsername(username);
    if (!admin || !admin.isActive) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, admin.password);
    return isValid ? admin : null;
  }

  async createTransaction(transaction: InsertTransaction & { adminId: string; adminUsername: string }): Promise<Transaction> {
    const id = randomUUID();
    const newTransaction: Transaction = {
      ...transaction,
      id,
      status: "completed",
      createdAt: new Date(),
    };
    
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async getTransactions(limit = 50, offset = 0): Promise<Transaction[]> {
    const allTransactions = Array.from(this.transactions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return allTransactions.slice(offset, offset + limit);
  }

  async getTransactionsByUID(userUID: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.userUID === userUID)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTransactionCount(): Promise<number> {
    return this.transactions.size;
  }
}

export const storage = new MemStorage();
