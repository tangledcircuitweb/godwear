import { z } from "zod";
import type { Context } from "hono";

export const zodErrorMap: z.ZodErrorMap;

export function apiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T): z.ZodDiscriminatedUnion<"success", [
  z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: T;
    meta: z.ZodOptional<z.ZodObject<{
      timestamp: z.ZodOptional<z.ZodString>;
      requestId: z.ZodOptional<z.ZodString>;
      version: z.ZodOptional<z.ZodString>;
      service: z.ZodOptional<z.ZodString>;
    }>>;
  }>,
  z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
      code: z.ZodString;
      message: z.ZodString;
      details: z.ZodOptional<z.ZodRecord<z.ZodUnknown>>;
      timestamp: z.ZodString;
      service: z.ZodOptional<z.ZodString>;
    }>;
  }>
]>;

export const paginationSchema: z.ZodObject<{
  total: z.ZodNumber;
  page: z.ZodNumber;
  pageSize: z.ZodNumber;
  totalPages: z.ZodNumber;
  hasNext: z.ZodBoolean;
  hasPrev: z.ZodBoolean;
}>;

export const paginationParamsSchema: z.ZodObject<{
  page: z.ZodDefault<z.ZodNumber>;
  pageSize: z.ZodDefault<z.ZodNumber>;
  sortBy: z.ZodOptional<z.ZodString>;
  sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}>;

export function paginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T): z.ZodObject<{
  items: z.ZodArray<T>;
  pagination: typeof paginationSchema;
}>;

export function validator<T extends z.ZodTypeAny>(
  schema: T,
  target?: "json" | "form" | "query"
): any;

export const baseRecordSchema: z.ZodObject<{
  id: z.ZodString;
  created_at: z.ZodString;
  updated_at: z.ZodString;
}>;

export function createEntitySchema<T extends z.ZodRawShape>(shape: T): z.ZodObject<z.extendShape<{
  id: z.ZodString;
  created_at: z.ZodString;
  updated_at: z.ZodString;
}, T>>;

export function parseData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T>;

export function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> | null;

export type InferSchema<T extends z.ZodTypeAny> = z.infer<T>;
