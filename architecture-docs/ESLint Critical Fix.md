# ESLint Critical Fix Strategy

## Overview
This document outlines the strategy for fixing ESLint issues discovered during the production build process. The issues are categorized by type and severity, with a clear plan for addressing each category.

## Categories of Issues

### 1. Unused Variables and Imports
These issues indicate dead code or unnecessary imports that should be cleaned up for better maintainability and bundle size.

#### Files Affected:
- **Components**
  - `ChannelList.tsx`: Unused `Button` import
  - `MainPanel.tsx`: Unused `sanitizeFileName`
  - `TopBar.tsx`: Unused `router` and `subscription`
  - `Message.tsx`: Unused `MessageErrorBoundary`, `error`
  - `MessageActions.tsx`: Unused `Reply`
  - `MessageErrorBoundary.tsx`: Unused `useEffect`, `useState`
  - `MessageInput.tsx`: Unused `data`, `handleKeyPress`
  - `MessageList.tsx`: Unused `VirtualMessage`

- **Providers**
  - `ChannelProvider.tsx`: Unused `StoreApi`, `UseBoundStore`, `ChannelStore`
  - `MessageProvider.tsx`: Unused `useMemo`, `StoreApi`, `UseBoundStore`, `MessageStore`

- **Hooks**
  - `useMessageOperations.ts`: Multiple unused variables including `retryCount`, `setRetryCount`, etc.

#### Fix Strategy:
1. Review each unused variable/import
2. Determine if it's:
   - Truly unused (remove)
   - Used but ESLint can't detect it (add ESLint ignore comment)
   - Needed for future use (add TODO comment)
3. For each removal, test the component to ensure no regressions

### 2. React Hook Dependencies
Missing dependencies in useEffect hooks can cause stale closures and bugs.

#### Files Affected:
- `useMessageOperations.ts`: Missing dependencies in useEffect
  ```typescript
  useEffect(() => {
    // ... code
  }, [channelId, getChannelAccess]) // Missing: addMessage, removeMessage, supabase
  ```

#### Fix Strategy:
1. Review each useEffect hook
2. Add missing dependencies
3. Consider using useCallback for function dependencies
4. Test for infinite re-render loops
5. Verify component behavior after changes

### 3. Type Safety Issues
TypeScript/ESLint warnings about type safety that could lead to runtime errors.

#### Files Affected:
- `useMessageOperations.ts`: Multiple `any` types
- `database.types.ts`: Multiple `any` types
- `input.tsx` and `textarea.tsx`: Empty interface warnings

#### Fix Strategy:
1. Replace `any` types with proper types
2. Define proper interfaces for components
3. Use type assertions where necessary
4. Document complex type decisions

### 4. Image Optimization
Next.js warnings about using optimized image components.

#### Files Affected:
- `MainPanel.tsx`
- `Message.tsx`

#### Fix Strategy:
1. Replace `<img>` with Next.js `<Image>` component
2. Configure proper image sizing
3. Add proper alt text
4. Test image loading performance

## Implementation Plan

### Phase 1: Critical Fixes
1. Fix unused variables that could affect runtime
2. Address React Hook dependency issues
3. Fix type safety issues in critical paths



Ah, the schema diagram helps a lot! Let me break down your questions:

1. **Supabase Query Definition Updates**:
Primary files that would need updating:
- `src/lib/database.types.ts` (main Supabase types)
- `src/store/types.ts` (our Message type)
- `src/hooks/useMessageOperations.ts` (query handling)

2. **Respecting Supabase's Data Configuration**:
Looking at your schema diagram, the `messages` table has:
```
- id (uuid)
- content (text)
- channel_id (uuid)
- user_id (uuid)
- file_url (text)
- created_at (timestamptz)
- attachment_path (text)
- edited_at (timestamptz)
- edited_by (uuid)
```

We can find all message-using components with a search:

Ran tool




Here's a proper implementation plan based on the schema and component usage:

1. **Update Database Types** (`src/lib/database.types.ts`):
```typescript
export interface Tables {
  messages: {
    Row: {
      id: string;
      content: string;
      channel_id: string;
      user_id: string;
      file_url: string | null;
      created_at: string;
      attachment_path: string | null;
      edited_at: string | null;
      edited_by: string | null;
    };
    Insert: Omit<Tables['messages']['Row'], 'id' | 'created_at'>;
    Update: Partial<Tables['messages']['Insert']>;
  };
}
```

2. **Components Needing Updates**:
- Message Display:
  - `src/components/messages/Message.tsx`
  - `src/components/messages/MessageList.tsx`
  
- Message Operations:
  - `src/hooks/useMessageOperations.ts`
  - `src/store/messageStore.ts`
  
- Error Handling:
  - `src/components/messages/MessageErrorBoundary.tsx`
  - `src/components/messages/MessageInput.tsx`

3. **Implementation Strategy**:
```typescript
// 1. Create a central error handling utility
// src/utils/messageErrors.ts
export class MessageValidationError extends Error {
  constructor(
    message: string,
    public field: keyof Message,
    public value: unknown
  ) {
    super(message);
  }
}

// 2. Update the type guard
function isValidMessage(data: unknown): asserts data is Message {
  if (!isRecord(data)) {
    throw new MessageValidationError('Invalid message format', 'id', data);
  }
  
  // Validate each field according to schema
  if (!isUUID(data.id)) {
    throw new MessageValidationError('Invalid message ID', 'id', data.id);
  }
  // ... more validations
}

// 3. Update components to use the new error handling
try {
  isValidMessage(messageData);
  // TypeScript now knows messageData is valid
  addMessage(messageData);
} catch (error) {
  if (error instanceof MessageValidationError) {
    console.error(`Invalid ${error.field}:`, error.value);
    // Handle specific field errors
  }
  // Handle other errors
}
```


### Phase 2: Optimization
1. Implement image optimizations
2. Clean up remaining unused variables
3. Improve type definitions

### Phase 3: Documentation
1. Document any ESLint suppressions
2. Update coding standards
3. Create PR review checklist

## Testing Strategy
1. Run local builds after each category of fixes
2. Test affected components
3. Verify no new ESLint errors introduced
4. Run full application test suite

## Maintenance
1. Set up pre-commit hooks for ESLint
2. Configure IDE to show ESLint warnings
3. Regular ESLint audit schedule

## Next Steps
1. Start with Phase 1 fixes
2. Run build after each fix
3. Document any unexpected issues
4. Update this strategy as needed

## Command Reference
```bash
# Check build
npm run build

# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
``` 