import { z } from "zod";

// Rule: Expense me title zaroori hai aur amount number hi hona chahiye (>0)
export const expenseSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters long"),
  amount: z.number().positive("Amount must be greater than zero"),
  category: z.string().optional(),
});

// --- Billing Schemas ---
export const billItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  price: z.number().nonnegative("Price cannot be negative"),
  total: z.number().nonnegative("Total cannot be negative"),
});

export const createBillSchema = z.object({
  billNumber: z.string().min(1, "Bill number is required"),
  partyId: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  customerMobile: z.string().optional(),
  customerAddress: z.string().optional(),
  customerGst: z.string().optional(),
  siteName: z.string().optional(),
  date: z.any().optional(), // Can be string or Date
  dueDate: z.any().optional(),
  items: z.array(billItemSchema).min(1, "At least one item is required"),
  total: z.number().nonnegative("Total amount must be valid"),
  tax: z.number().nonnegative().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().nonnegative().optional(),
  finalAmount: z.number().nonnegative("Final amount must be valid"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  billImageUrl: z.string().optional(),
});

// --- Purchase Schemas ---
export const purchaseItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  price: z.number().nonnegative("Price cannot be negative"),
  total: z.number().nonnegative("Total cannot be negative"),
});

export const createPurchaseSchema = z.object({
  purchaseNumber: z.string().optional(),
  partyId: z.string().min(1, "Party/Supplier ID is required"),
  date: z.any().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
  finalAmount: z.number().nonnegative("Final amount is required"),
  amountPaid: z.number().nonnegative().optional(),
  paymentMethod: z.string().optional(),
});