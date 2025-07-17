/**
 * Zod Examples for GodWear
 * 
 * This file provides examples of how to use Zod for schema validation
 * following the AI-first codebase principles.
 */

import { z } from "zod";

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
const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.discriminatedUnion("success", [
    z.object({
      success: z.literal(true),
      data: dataSchema,
    }),
    z.object({
      success: z.literal(false),
      error: z.object({
        code: z.string(),
        message: z.string(),
      }),
    }),
  ]);

// Using the API response schema
const userResponseSchema = apiResponseSchema(userSchema);
type UserResponse = z.infer<typeof userResponseSchema>;

// Example of parsing data
function parseUserData(data: unknown): User {
  return userSchema.parse(data);
}

// Example of safe parsing
function safeParseUserData(data: unknown): { success: boolean; data?: User; error?: z.ZodError } {
  const result = userSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

// Example of partial schema
const userUpdateSchema = userSchema.partial().omit({ id: true, createdAt: true });
type UserUpdate = z.infer<typeof userUpdateSchema>;

// Example of extending a schema
const adminUserSchema = userSchema.extend({
  permissions: z.array(z.string()),
  adminSince: z.string().datetime(),
});
type AdminUser = z.infer<typeof adminUserSchema>;

// Example of nested objects
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.string(),
});

const userWithAddressSchema = userSchema.extend({
  address: addressSchema,
});
type UserWithAddress = z.infer<typeof userWithAddressSchema>;

// Example of array validation
const usersSchema = z.array(userSchema);
type Users = z.infer<typeof usersSchema>;

// Example of record validation
const userRecordSchema = z.record(z.string(), userSchema);
type UserRecord = z.infer<typeof userRecordSchema>;

// Example of union types
const identifierSchema = z.union([
  z.string().uuid(),
  z.number().int().positive(),
  z.object({ email: z.string().email() }),
]);
type Identifier = z.infer<typeof identifierSchema>;

// Example of refinement
const evenNumberSchema = z.number().refine((n) => n % 2 === 0, {
  message: "Number must be even",
});
type EvenNumber = z.infer<typeof evenNumberSchema>;

// Example of transformation
const dateStringSchema = z.string().transform((str) => new Date(str));
type DateString = z.infer<typeof dateStringSchema>;

// Example of default values
const configSchema = z.object({
  apiUrl: z.string().url().default("https://api.example.com"),
  timeout: z.number().positive().default(5000),
  retries: z.number().int().nonnegative().default(3),
});
type Config = z.infer<typeof configSchema>;

// Example of custom error messages
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
  "Password must include uppercase, lowercase, number and special character"
);
type Password = z.infer<typeof passwordSchema>;

// Example of optional fields
const signupSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: passwordSchema,
  confirmPassword: passwordSchema,
  newsletter: z.boolean().default(false),
  referredBy: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type Signup = z.infer<typeof signupSchema>;

// Export examples for documentation
export {
  userSchema,
  apiResponseSchema,
  userResponseSchema,
  parseUserData,
  safeParseUserData,
  userUpdateSchema,
  adminUserSchema,
  addressSchema,
  userWithAddressSchema,
  usersSchema,
  userRecordSchema,
  identifierSchema,
  evenNumberSchema,
  dateStringSchema,
  configSchema,
  passwordSchema,
  signupSchema,
};

// Export types
export type {
  User,
  UserResponse,
  UserUpdate,
  AdminUser,
  UserWithAddress,
  Users,
  UserRecord,
  Identifier,
  EvenNumber,
  DateString,
  Config,
  Password,
  Signup,
};
