/**
 * Zod Examples for GodWear
 * 
 * This file provides examples of how to use Zod for schema validation
 * following the AI-first codebase principles.
 */

import { z } from "zod";
import { createDiscriminatedUnion } from "./zod-compat";

// Basic schema definition
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  age: z.number().int().min(18, "Must be at least 18 years old").optional(),
  role: z.enum(["user", "admin", "moderator"]).default("user"),
  createdAt: z.string().datetime(),
});

// Type inference from schema
type User = z.infer<typeof userSchema>;

// API response schema with discriminated union
const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  const successSchema = z.object({
    success: z.literal(true),
    data: dataSchema,
  });
  
  const errorSchema = z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  });
  
  return createDiscriminatedUnion("success", [successSchema, errorSchema]);
};

// Using the API response schema
const userResponseSchema = apiResponseSchema(userSchema);
