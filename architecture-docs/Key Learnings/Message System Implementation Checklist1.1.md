# Message System Implementation Checklist - Revised

## Phase 1: Message Creation & User Data Flow

### 1. Message Creation Pipeline
- [ ] 1.1 User Data Validation in `useMessageOperations.sendMessage`
    - Success Metric: Zero "Invalid user data in response" errors
    - Current Issue: User data array validation failing at line 195-197
    - Implementation:
        ```typescript
        // Current problematic check:
        if (!data.user || !Array.isArray(data.user) || data.user.length === 0)
        
        // Need to align with actual Supabase response shape:
        if (!data.user || typeof data.user !== 'object')
        ```
    - Test Cases:
        - Message creation with valid user data succeeds
        - Response shape matches Supabase join pattern

- [ ] 1.2 Supabase Query Structure
    - Success Metric: Consistent user data shape in all queries
    - Implementation:
        ```typescript
        // Standardize join pattern across all queries:
        .from('messages')
        .select(`
          *,
          user:users!messages_user_id_fkey (
            id, name, email, avatar_url, created_at, last_seen
          )
        `)
        ```
    - Test Cases:
        - Join syntax matches between fetch and create
        - User data structure consistent across operations

### 2. Channel Access Pattern Alignment

- [ ] 2.1 Channel Privacy Handling
    - Success Metric: Messages load in both public and private channels
    - Current Issue: Messages only loading in private channels
    - Implementation:
        - [ ] Align `ChannelList.tsx` access checks with `useMessageOperations.ts`
        - [ ] Verify channel member status before message operations
        - [ ] Handle public channel access in `useChannelAccess` hook
    - Test Cases:
        - Public channel message loading works
        - Private channel access control maintained
        - Proper error handling for unauthorized access

- [ ] 2.2 Channel Member Context
    - Success Metric: Proper user context in all channel operations
    - Implementation:
        - [ ] Add channel member status check to `MessageProvider`
        - [ ] Integrate with existing `ChannelMembers` component
        - [ ] Update `useMessageOperations` to respect member status
    - Test Cases:
        - Member status properly affects message operations
        - Non-members can't send messages in private channels
        - Public channel behavior respects access rules

### 3. State Management Refinement

- [ ] 3.1 Message Store Initialization
    - Success Metric: Consistent store state across all operations
    - Implementation:
        ```typescript
        // In MessageProvider.tsx
        const store = useMemo(() => {
          if (typeof window === 'undefined') {
            return null; // Instead of creating dummy store
          }
          return createMessageStore();
        }, []);
        ```
    - Test Cases:
        - Store properly hydrates after SSR
        - No store creation during SSR
        - Clean state management during channel switches

- [ ] 3.2 Message Action Error Handling
    - Success Metric: Clear error messages for all failure modes
    - Implementation:
        - [ ] Add error type discrimination in `useMessageOperations`
        - [ ] Implement proper error recovery in store actions
        - [ ] Add toast notifications for all error cases
    - Test Cases:
        - User data errors properly caught and displayed
        - Network errors handled gracefully
        - State remains consistent after errors

## Phase 2: Data Integrity & Performance

### 4. Database Query Optimization

- [ ] 4.1 Message Loading Query
    - Success Metric: < 200ms load time for initial messages
    - Implementation:
        ```sql
        -- Add index for message loading
        CREATE INDEX idx_messages_channel_created 
        ON messages(channel_id, created_at);
        ```
    - Test Cases:
        - Query execution plan uses index
        - Performance consistent with large message sets

- [ ] 4.2 User Data Caching
    - Success Metric: No duplicate user data fetches
    - Implementation:
        - [ ] Implement user data cache in `MessageProvider`
        - [ ] Add cache invalidation on user updates
        - [ ] Share user data across message instances
    - Test Cases:
        - User data reused across messages
        - Cache properly invalidated on updates
        - Memory usage remains constant

### 5. Component Optimization

- [ ] 5.1 Message List Virtualization
    - Success Metric: Smooth scrolling with 1000+ messages
    - Current Implementation Review:
        - Virtual list implementation in `MessageList.tsx`
        - Dynamic height calculations
        - Scroll position maintenance
    - Test Cases:
        - No layout shifts during scroll
        - Memory usage stable with large message sets
        - Proper cleanup on unmount

## Implementation Sequence

1. Fix Message Creation Pipeline (1.1, 1.2)
   - Highest priority as it's blocking message sending
   - Fixes current user data error

2. Align Channel Access (2.1, 2.2)
   - Required for consistent message loading
   - Builds on fixed message creation

3. Refine State Management (3.1, 3.2)
   - Improves reliability and user experience
   - Prevents data loss issues

4. Optimize Performance (4.1, 4.2, 5.1)
   - After core functionality is stable
   - Improves scalability and UX

## Success Metrics Summary
1. Zero "Invalid user data" errors
2. Messages load in all channel types
3. < 200ms initial load time
4. Smooth scrolling with 1000+ messages
5. Consistent error handling and recovery
6. No memory leaks or performance degradation