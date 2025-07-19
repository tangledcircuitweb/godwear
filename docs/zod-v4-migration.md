# Zod v4 Migration Guide

This document provides a comprehensive guide for migrating from Zod v3 to Zod v4 in the GodWear project.

## Overview

Zod 4 is now stable and offers significant improvements:

- **Performance**: 14x faster string parsing, 7x faster array parsing, 6.5x faster object parsing
- **TypeScript Efficiency**: 100x reduction in TypeScript instantiations
- **Bundle Size**: 2x reduction in core bundle size (from 12.47kb to 5.36kb gzipped)
- **New Features**: Metadata and registries, JSON Schema support

To upgrade:

```bash
npm install zod@^4.0.0
```

## GodWear Migration Strategy

In GodWear, we've adopted a direct migration approach to Zod v4, avoiding compatibility layers or shims. This ensures we fully leverage the performance and feature benefits of Zod v4.

### Key Migration Points

1. **Direct API Usage**: We use native Zod v4 APIs directly rather than maintaining backward compatibility with v3 patterns
2. **Parameter Requirements**: Zod v4 requires additional parameters for many functions:
   - `z.email({})` - Email validation requires an empty options object
   - `z.union([...], {})` - Union requires an options object as second parameter
   - `z.discriminatedUnion(discriminator, [...], {})` - Requires discriminator, options array, and options object
   - `z.record(z.string(), z.unknown())` - Record requires key type and value type parameters

### Example Migrations

#### Email Validation

```typescript
// Zod v3
z.string().email()

// Zod v4
z.email({})
```

#### Union Types

```typescript
// Zod v3
z.union([z.string(), z.number()])

// Zod v4
z.union([z.string(), z.number()], {})
```

#### Record Types

```typescript
// Zod v3
z.record(z.unknown())

// Zod v4
z.record(z.string(), z.unknown())
```

#### Discriminated Unions

```typescript
// Zod v3
z.discriminatedUnion("type", [successSchema, errorSchema])

// Zod v4
z.discriminatedUnion("type", [successSchema, errorSchema], {})
```

## Breaking Changes

### Error Customization

Zod 4 standardizes error customization under a unified `error` param:

#### Deprecates `message`

```typescript
// Zod 4
z.string().min(5, { error: "Too short." });
```

#### Drops `invalid_type_error` and `required_error`

These are replaced with the new `error` parameter:

```typescript
// Zod 4
z.string({ 
  error: (issue) => issue.input === undefined 
    ? "This field is required" 
    : "Not a string" 
});
```

#### Drops `errorMap`

Renamed to `error`. Error maps can now return a plain `string` (instead of `{message: string}`). They can also return `undefined` to yield control to the next error map in the chain.

```typescript
// Zod 4
z.string().min(5, {
  error: (issue) => {
    if (issue.code === "too_small") {
      return `Value must be >${issue.minimum}`
    }
  },
});
```

### ZodError Updates

#### Updated Issue Formats

Issue formats have been streamlined:

```typescript
// Zod 4 issue types
type IssueFormats = 
  | z.core.$ZodIssueInvalidType
  | z.core.$ZodIssueTooBig
  | z.core.$ZodIssueTooSmall
  | z.core.$ZodIssueInvalidStringFormat
  | z.core.$ZodIssueNotMultipleOf
  | z.core.$ZodIssueUnrecognizedKeys
  | z.core.$ZodIssueInvalidValue
  | z.core.$ZodIssueInvalidUnion
  | z.core.$ZodIssueInvalidKey     // new: used for z.record/z.map 
  | z.core.$ZodIssueInvalidElement // new: used for z.map/z.set
  | z.core.$ZodIssueCustom;
```

#### Changed Error Map Precedence

An error map passed into `.parse()` no longer takes precedence over a schema-level error map:

```typescript
// Zod 4
const mySchema = z.string({ error: () => "Schema-level error" });
mySchema.parse(12, { error: () => "Contextual error" }); // => "Schema-level error"
```

#### Deprecated `.format()` and `.flatten()`

Use the top-level `z.treeifyError()` function instead.

#### Dropped `.formErrors`

This API was identical to `.flatten()` and is no longer available.

#### Deprecated `.addIssue()` and `.addIssues()`

Directly push to `err.issues` array instead:

```typescript
myError.issues.push({ 
  // new issue
});
```

### z.number() Updates

#### No Infinite Values

`POSITIVE_INFINITY` and `NEGATIVE_INFINITY` are no longer considered valid values for `z.number()`.

#### `.safe()` No Longer Accepts Floats

Now behaves identically to `.int()` and only accepts integers.

#### `.int()` Accepts Safe Integers Only

No longer accepts unsafe integers (outside the range of `Number.MIN_SAFE_INTEGER` and `Number.MAX_SAFE_INTEGER`).

### z.string() Updates

#### Moved String Formats to Top-Level

String formats are now represented as subclasses of `ZodString` and moved to the top-level `z` namespace:

```typescript
z.email({});
z.uuid({});
z.url({});
z.emoji({});         // validates a single emoji character
z.base64({});
z.base64url({});
z.nanoid({});
z.cuid({});
z.cuid2({});
z.ulid({});
z.ipv4({});
z.ipv6({});
z.cidrv4({});        // ip range
z.cidrv6({});        // ip range
z.iso.date({});
z.iso.time({});
z.iso.datetime({});
z.iso.duration({});
```

The method forms (e.g., `z.string().email()`) still exist but are deprecated.

#### Stricter UUID Validation

The `z.uuid()` now validates UUIDs more strictly against RFC 9562/4122. For a more permissive "UUID-like" validator, use `z.guid()`.

#### No Padding in `.base64url()`

Padding is no longer allowed in `z.base64url()`.

#### Replaced `.ip()` with `.ipv4()` and `.ipv6()`

Use `z.union()` to combine them if needed:

```typescript
z.string().ip() // ❌
z.ipv4({}) // ✅
z.ipv6({}) // ✅
```

#### Updated `.ipv6()` Validation

Validation now uses the `new URL()` constructor for more robust validation.

#### Replaced `.cidr()` with `.cidrv4()` and `.cidrv6()`

```typescript
z.string().cidr() // ❌
z.cidrv4({}) // ✅
z.cidrv6({}) // ✅
```

### z.coerce Updates

The input type of all `z.coerce` schemas is now `unknown`:

```typescript
const schema = z.coerce.string();
type schemaInput = z.input<typeof schema>;
// Zod 3: string;
// Zod 4: unknown;
```

### .default() Updates

The application of `.default()` has changed. If the input is `undefined`, `ZodDefault` short-circuits the parsing process and returns the default value. The default value must be assignable to the *output type*.

```typescript
const schema = z.string()
  .transform(val => val.length)
  .default(0); // should be a number
schema.parse(undefined); // => 0
```

To replicate the old behavior, use the new `.prefault()` API:

```typescript
const schema = z.string()
  .transform(val => val.length)
  .prefault("tuna");
schema.parse(undefined); // => 4
```

### z.object() Updates

#### Deprecated `.strict()` and `.passthrough()`

Use the top-level `z.strictObject()` and `z.looseObject()` instead.

## New Features

### Zod Mini

A tree-shakable variant with a functional API:

```typescript
import * as z from "zod/mini";

z.optional(z.string());
z.union([z.string(), z.number()], {});
z.extend(z.object({ /* ... */ }), { age: z.number() });
```

### Metadata and Registries

Zod 4 introduces a new metadata system and schema registries. See the [Metadata and registries docs](https://zod.dev/metadata) for more information.

### JSON Schema

Zod 4 adds support for generating JSON Schema from Zod schemas. See the [JSON Schema docs](https://zod.dev/json-schema) for more information.

## Recommended Migration Steps

1. Update the Zod dependency to v4
2. Replace deprecated string format methods with top-level equivalents
3. Update error customization to use the unified `error` parameter
4. Review and update any code using `.default()` to ensure it works as expected
5. Replace any usage of `.strict()` and `.passthrough()` with top-level equivalents
6. Add required parameters to functions like `z.email()`, `z.union()`, and `z.record()`
7. Test thoroughly, especially validation logic and error handling

## Resources

- [Zod v4 Documentation](https://zod.dev/v4)
- [Zod v4 Migration Guide](https://zod.dev/v4/changelog)
- [Zod v4 Versioning](https://zod.dev/v4/versioning)
