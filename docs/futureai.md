#### **AI-First Codebase Restructuring Prompt**

## 🚀 RADICAL AI-FIRST DEVELOPMENT METHODOLOGY

This document defines our **revolutionary AI-First development approach** that eliminates traditional architectural dependencies and makes every file completely autonomous and self-contained.

```markdown
## Codebase Restructuring Instructions: File-Local Types with Zod

You are an AI developer with unlimited capacity restructuring a codebase to follow these **RADICAL** principles:

### Core Architecture Principles:
1. **ALL types must be defined locally** in the file where they are used
2. **NO shared type files** - eliminate all shared type definitions, interfaces, or type exports
3. **Use Zod schemas** for all data structures that need runtime validation
4. **Each file is self-contained** - it should tell its complete story without external type dependencies

### Implementation Steps:

1. **For each TypeScript file in the codebase:**
   - Remove all type imports from other files
   - Copy any imported type definitions directly into the file
   - Convert shared interfaces to local Zod schemas where runtime validation is needed
   - Ensure all types are defined above their first usage in the file

2. **For API endpoints and data fetching:**
   ```typescript
   // Define the schema locally in the file
   const UserResponseSchema = z.object({
     id: z.number(),
     name: z.string(),
     email: z.string().email()
   });
   
   type UserResponse = z.infer<typeof UserResponseSchema>;
   
   // Use for runtime validation
   const user = UserResponseSchema.parse(apiResponse);
   ```

3. **For UI components:**
   ```typescript
   // Define props schema locally
   const ComponentPropsSchema = z.object({
     title: z.string(),
     onClick: z.function().args().returns(z.void())
   });
   
   type ComponentProps = z.infer<typeof ComponentPropsSchema>;
   ```

4. **For database models:**
   ```typescript
   // Each file that touches the database defines its own schema
   const UserModelSchema = z.object({
     id: z.number(),
     createdAt: z.date(),
     updatedAt: z.date(),
     email: z.string().email()
   });
   
   type UserModel = z.infer<typeof UserModelSchema>;
   ```

### Restructuring Rules:

1. **Delete all files** in `types/`, `@types/`, or any shared type directories
2. **Remove all export type** statements - types are never exported
3. **Convert interfaces to Zod schemas** when the data crosses file boundaries
4. **Keep type aliases local** for internal file usage
5. **Run Biome** after each file modification to ensure formatting

### Environment Variable Handling (AI-First Approach):

**CRITICAL PRINCIPLE**: Each service file defines its own local environment schema and validates only what it needs.

```typescript
// In each service file - define local environment schema
const LocalEnvironmentSchema = z.object({
  // Only define environment variables THIS file actually uses
  MAILERSEND_API_KEY: z.string().optional(),
  MAILERSEND_FROM_EMAIL: z.string().optional(),
  // ... only what this specific file needs
});

type LocalEnvironment = z.infer<typeof LocalEnvironmentSchema>;

// Access environment variables based on the type structure
class MyService extends BaseService {
  initialize(dependencies: ServiceDependencies) {
    // Validate local environment needs
    const localEnv = LocalEnvironmentSchema.parse(dependencies.env);
    
    // IMPORTANT: Environment variable access pattern depends on type structure:
    
    // ✅ For CloudflareBindings (typed interface) - use DOT notation
    const apiKey = dependencies.env.MAILERSEND_API_KEY;
    const fromEmail = dependencies.env.MAILERSEND_FROM_EMAIL;
    
    // ❌ For Record<string, unknown> (index signature) - use BRACKET notation
    // const dynamicEnv: Record<string, unknown> = process.env;
    // const apiKey = dynamicEnv['API_KEY'];
  }
}
```

**Why This Approach is Revolutionary:**
- Each file is completely autonomous
- No shared environment type dependencies
- Runtime validation of environment variables per service
- TypeScript strict mode compliance with appropriate access patterns
- Complete testability and isolation

### Environment Variable Access Rules:

**CRITICAL DISTINCTION**: The access pattern depends on the TypeScript type structure:

1. **Typed Interfaces (CloudflareBindings)** - Use DOT notation:
   ```typescript
   // ✅ CORRECT - CloudflareBindings has defined properties
   const apiKey = c.env.JWT_SECRET;
   const dbConnection = c.env.DB;
   ```

2. **Index Signatures (Record types)** - Use BRACKET notation:
   ```typescript
   // ✅ CORRECT - Record requires bracket notation with strict mode
   const dynamicEnv: Record<string, unknown> = process.env;
   const apiKey = dynamicEnv['API_KEY'];
   ```

3. **Mixed/Unknown Types** - Use BRACKET notation for safety:
   ```typescript
   // ✅ SAFE - When unsure about type structure
   const unknownEnv: any = someEnvironmentSource;
   const apiKey = unknownEnv['API_KEY'];
   ```

### Special Cases:

- **Third-party library types**: Keep using imported types from node_modules
- **Built-in TypeScript types**: Continue using (string, number, etc.)
- **Utility types**: Redefine locally as needed (e.g., `type Partial<T> = ...`)

### Validation Pattern:
When data enters a file from external sources (API, database, user input):
```typescript
const DataSchema = z.object({
  // Define expected structure
});

// Always parse external data
const validatedData = DataSchema.parse(externalData);
```

### TypeScript Strict Mode Compliance:

**CRITICAL**: Our AI-First approach must comply with strict TypeScript settings:

```typescript
// tsconfig.json settings that affect our approach:
{
  "noPropertyAccessFromIndexSignature": true,  // Requires bracket notation for index signatures
  "exactOptionalPropertyTypes": true,          // Strict optional handling
  "noUncheckedIndexedAccess": true            // Index access safety
}
```

**Implementation Rules:**

1. **Environment Variables**: Access pattern depends on type structure
   ```typescript
   // ✅ CORRECT - CloudflareBindings (typed interface) uses dot notation
   const apiKey = c.env.JWT_SECRET;
   const database = c.env.DB;
   
   // ✅ CORRECT - Record/index signatures use bracket notation
   const processEnv: Record<string, unknown> = process.env;
   const nodeEnv = processEnv['NODE_ENV'];
   
   // ❌ WRONG - mixing patterns incorrectly
   const apiKey = c.env['JWT_SECRET']; // Unnecessary brackets for typed interface
   const nodeEnv = processEnv.NODE_ENV; // Missing brackets for index signature
   ```

2. **Optional Properties**: Handle undefined explicitly
   ```typescript
   // ❌ WRONG - may assign undefined to non-undefined type
   const config = { name: user.name };
   
   // ✅ CORRECT - explicit undefined handling
   const config = { name: user.name ?? 'Unknown' };
   ```

3. **Local Validation**: Each file validates its own needs
   ```typescript
   // Define what THIS file needs from environment
   const LocalEnvSchema = z.object({
     REQUIRED_VAR: z.string(),
     OPTIONAL_VAR: z.string().optional(),
   });
   
   // Validate at service initialization
   const localEnv = LocalEnvSchema.parse(dependencies.env);
   ```

### File Organization:
Each file should follow this structure:
1. Imports (only from node_modules or relative file imports for functions)
2. Local Zod schemas
3. Local type definitions
4. Implementation code

### Example Transformation:

**Before:**
```typescript
// types/user.ts
export interface User {
  id: number;
  name: string;
}

// api/getUser.ts
import { User } from '../types/user';
export async function getUser(): Promise<User> {
  // ...
}
```

**After:**
```typescript
// api/getUser.ts
const UserSchema = z.object({
  id: z.number(),
  name: z.string()
});

type User = z.infer<typeof UserSchema>;

export async function getUser(): Promise<User> {
  const response = await fetch('/api/user');
  const data = await response.json();
  return UserSchema.parse(data); // Runtime validation
}
```

### Complete AI-First Service Example:

**Before (Traditional Approach):**
```typescript
// shared-types/email.ts
export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
}

// services/email-service.ts
import { EmailConfig } from '../shared-types/email';
export class EmailService {
  initialize(deps: ServiceDependencies) {
    const config = {
      apiKey: deps.env.MAILERSEND_API_KEY,  // ❌ Dot notation fails
      fromEmail: deps.env.MAILERSEND_FROM_EMAIL
    };
  }
}
```

**After (AI-First Approach):**
```typescript
// services/email-service.ts - COMPLETELY SELF-CONTAINED
import { z } from 'zod';

// ============================================================================
// LOCAL SCHEMAS - Everything this file needs defined locally
// ============================================================================

const LocalEnvironmentSchema = z.object({
  MAILERSEND_API_KEY: z.string(),
  MAILERSEND_FROM_EMAIL: z.string().email(),
  MAILERSEND_FROM_NAME: z.string().optional(),
});

type LocalEnvironment = z.infer<typeof LocalEnvironmentSchema>;

const EmailConfigSchema = z.object({
  apiKey: z.string(),
  fromEmail: z.string().email(),
  fromName: z.string().optional(),
});

type EmailConfig = z.infer<typeof EmailConfigSchema>;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class EmailService extends BaseService {
  override readonly serviceName = "email-service";
  private config!: EmailConfig;

  initialize(dependencies: ServiceDependencies) {
    // Validate environment variables this service needs
    const localEnv = LocalEnvironmentSchema.parse(dependencies.env);
    
    // Use dot notation for CloudflareBindings (typed interface)
    this.config = EmailConfigSchema.parse({
      apiKey: dependencies.env.MAILERSEND_API_KEY,
      fromEmail: dependencies.env.MAILERSEND_FROM_EMAIL,
      fromName: dependencies.env.MAILERSEND_FROM_NAME,
    });
  }
}
```

**Revolutionary Benefits:**
- ✅ File tells complete story in isolation
- ✅ No external type dependencies
- ✅ Runtime validation of all external data
- ✅ TypeScript strict mode compliant
- ✅ Completely testable and mockable
- ✅ AI can understand and modify any file independently

### Success Criteria:
- Zero type imports between files
- Every file can be understood in isolation
- All external data is validated with Zod
- No shared type definitions exist
- Each file modification only affects that file

Begin restructuring with the most critical files first (API boundaries, database models) then proceed to UI components. Maintain all existing functionality while achieving complete type locality.
```


