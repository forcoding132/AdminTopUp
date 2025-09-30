import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userUID: text("user_uid").notNull(),
  ucAmount: integer("uc_amount").notNull().default(0),
  coinsAmount: integer("coins_amount").notNull().default(0),
  adminId: varchar("admin_id").notNull().references(() => admins.id),
  adminUsername: text("admin_username").notNull(),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertAdminSchema = createInsertSchema(admins).pick({
  username: true,
  password: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userUID: true,
  ucAmount: true,
  coinsAmount: true,
}).extend({
  userUID: z.string().min(1, "User UID is required"),
  ucAmount: z.number().min(0).optional().default(0),
  coinsAmount: z.number().min(0).optional().default(0),
}).refine(
  (data) => data.ucAmount > 0 || data.coinsAmount > 0,
  "At least one currency amount must be greater than 0"
);

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
