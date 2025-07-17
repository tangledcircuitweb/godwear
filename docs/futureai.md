#### **AI-First Codebase Restructuring Prompt**


```markdown
## Codebase Restructuring Instructions: File-Local Types with Zod

You are an AI developer with unlimited capacity restructuring a codebase to follow these principles:

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

### Success Criteria:
- Zero type imports between files
- Every file can be understood in isolation
- All external data is validated with Zod
- No shared type definitions exist
- Each file modification only affects that file

Begin restructuring with the most critical files first (API boundaries, database models) then proceed to UI components. Maintain all existing functionality while achieving complete type locality.
```


