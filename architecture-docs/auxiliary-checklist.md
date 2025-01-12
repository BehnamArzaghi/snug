# **Unified Implementation & Migration Roadmap**

## **Current Phase: Critical Integration & MVP Launch**

### 1. **Core Message Infrastructure (✓ Completed)**
- **✓** Zustand Store Implementation
  - **✓** Base store structure
  - **✓** Message state management
  - **✓** Real-time subscription handling
  - **✓** Optimistic updates
  - **✓** SSR-safe initialization patterns

**Verification Steps**:
1. **Store Implementation**
   - **✓** Confirm typed store interface with SSR safety
   - **✓** Validate real-time subscriptions stability
   - **✓** Test optimistic updates with rollback
2. **SSR Safety**
   - **✓** Verify store initialization without early window access
   - **✓** Confirm _app.tsx hydration consistency
3. **Basic Flow**
   - **✓** Test send/receive message cycle
   - **✓** Verify no console errors during hydration

### 2. **Critical Integration (High Priority)**
- **MainPanel & ChannelView Integration**
  - **[ ]** Update `MainPanel` to use new message system
    - Replace old component references
    - Ensure SSR safety (no top-level window usage)
    - Test real-time update flow
  - **[ ]** Update `ChannelView` to use new system
    - Integrate store selectors
    - Verify channel switching logic
    - Test rapid channel changes
  - **[ ]** Test real-time updates across components
    - Multi-tab message synchronization
    - Channel switch message cleanup
    - Presence state consistency
  - **[ ]** Verify channel switching functionality
    - Clean message unmount/mount
    - State reset between channels
    - Subscription management
- **Message Component Safety**
  - **[ ]** Verify SSR safety in all message components
    - Check for client-only API usage
    - Implement conditional rendering where needed
  - **[ ]** Test hydration consistency
    - Monitor console for mismatch warnings
    - Verify server/client state alignment
  - **[ ]** Implement proper loading states
    - Add skeleton UI for initial load
    - Handle slow network scenarios
- **Clean Up**
  - **[ ]** Remove deprecated components:
    - **[ ]** `expandable-chat.tsx`
    - **[ ]** `chat-message-list.tsx`
    - **[ ]** `chat-input.tsx`
    - Verify no remaining imports
    - Test after removal

### 3. **MVP Launch Requirements**

#### 3.1 **Essential MVP Deliverables (Day 1)**
- **Core Messaging**
  - **[ ]** Basic message sending/receiving
  - **[ ]** Channel switching
  - **[ ]** Real-time updates
  - **[ ]** SSR-safe store implementation
- **Critical UI**
  - **[ ]** Basic loading states
  - **[ ]** Error handling
  - **[ ]** Mobile-responsive layout
- **Manual Testing**
  - **[ ]** Verify message flow
  - **[ ]** Test channel switching
  - **[ ]** Check real-time updates
  - **[ ]** Validate SSR behavior

#### 3.2 **Complete MVP Features (Post-Launch)**
- **Core Functionality**
  - **[ ]** Basic message sending/receiving
    - Real-time delivery verification
    - SSR compatibility check
    - Multi-user testing
  - **[ ]** Channel switching
    - Subscription management
    - State cleanup
    - Performance testing
  - **[ ]** Real-time updates
    - Message ordering
    - Duplicate prevention
    - Rapid message handling
  - **[ ]** Basic presence indicators
    - Online state tracking
    - State persistence
    - Multi-tab handling
- **Critical UI Polish**
  - **[ ]** Loading states
    - Channel load indicators
    - Message send feedback
    - Transition animations
  - **[ ]** Error states
    - Network error handling
    - Retry mechanisms
    - User feedback
  - **[ ]** Basic responsive layout
    - Mobile view testing
    - Desktop optimization
    - Breakpoint verification
- **Pre-Launch Verification**
  - **[ ]** Test core flows
    - End-to-end user journey
    - Edge case handling
    - Performance metrics
  - **[ ]** Verify SSR behavior
    - Initial load testing
    - Hydration verification
    - Route transition checks
  - **[ ]** Check real-time functionality
    - Multi-user scenarios
    - Load testing
    - Connection recovery

#### 3.3 **Threading Preparation (Critical for Future)**
- **Data Layer**
  - **[ ]** Verify message schema includes `parent_message_id`
  - **[ ]** Ensure types support thread-related fields
  - **[ ]** Confirm store structure includes `threadMessages`
- **Store Implementation**
  - **[ ]** Add placeholder thread methods (inactive)
  - **[ ]** Prepare subscription handlers for threads
  - **[ ]** Structure message queries for future thread support
- **UI Preparation**
  - **[ ]** Add thread-aware message component structure
  - **[ ]** Include placeholder thread indicators (hidden)
  - **[ ]** Prepare route structure for future thread views

### 4. **Deployment Preparation**
- **Environment Setup**
  - **[ ]** Configure Vercel deployment
  - **[ ]** Set up environment variables
  - **[ ]** Verify Supabase connection
- **Launch Checklist**
  - **[ ]** Remove debug logs
  - **[ ]** Test with multiple users
  - **[ ]** Verify production build

### 4. **Testing Strategy**
- **Current Phase (Manual Testing)**
  - **[ ]** Test core message flows
    - Send/receive in different channels
    - Verify real-time updates
    - Check SSR behavior
  - **[ ]** Test UI states
    - Loading indicators
    - Error messages
    - Responsive layout
  - **[ ]** Multi-user scenarios
    - Multiple users in same channel
    - Channel switching behavior
    - Presence indicators

- **Future Testing (Post-MVP)**
  - **[ ]** Unit tests for core functionality
  - **[ ]** Integration tests for message flow
  - **[ ]** E2E tests for critical paths

# **Post-MVP Features**

### 5. **Enhanced Messaging**
- **Thread Implementation**
  - **[ ]** Update database schema
  - **[ ]** Implement thread UI components
  - **[ ]** Add real-time thread subscriptions
- **File Handling**
  - **[ ]** Implement file upload system
  - **[ ]** Add image previews
  - **[ ]** Handle upload errors

### 6. **Advanced Features**
- **Channel Management**
  - **[ ]** Unread indicators
  - **[ ]** Channel search
  - **[ ]** Member management
- **Presence System**
  - **[ ]** Enhanced presence indicators
  - **[ ]** Offline detection
  - **[ ]** Status updates

# **Defunct Items (Archived)**

### D1. **Architectural Changes**
- ~~Implement `SlackMessage.tsx` extending ChatBubble~~ (Replaced with standalone Message component)
- ~~Create SSR testing framework~~ (Simplified to core SSR safety checks)
- ~~Implement SSR linting rules~~ (Using TypeScript for safety)
- ~~Add hydration monitoring~~ (Relying on console warnings)

### D2. **Component Patterns**
- ~~Define SSR component guidelines~~ (Moved to inline documentation)
- ~~Create reusable SSR hooks~~ (Using simpler patterns)
- ~~Implement SSR boundary detection~~ (Using ClientOnly wrapper)
- ~~Add automatic optimization~~ (Manual optimization preferred)

### D3. **Data Flow**
- ~~Implement SSR data prefetching~~ (Using simpler initialization)
- ~~Create state serialization strategy~~ (Using Zustand's built-in handling)
- ~~Add cache invalidation patterns~~ (Not needed for MVP)
- ~~Define data requirements spec~~ (Using TypeScript types)

### D4. **Long-term Infrastructure**
- ~~Create performance benchmarks~~ (Post-MVP consideration)
- ~~Add SSR error tracking~~ (Using basic error boundaries)
- ~~Implement hydration metrics~~ (Using console warnings)
- ~~Create debug tooling~~ (Using browser devtools)

---

## **Implementation Notes**
- **Store Management**: Using Zustand with SSR-safe patterns
  ```typescript
  // Example store initialization
  const useMessageStore = createMessageStore({
    messages: {},
    addMessage: (message) => set((state) => ({
      messages: { ...state.messages, [message.id]: message }
    }))
  });
  ```
- **SSR Safety**: All stores must use client-side initialization pattern
- **Testing**: Currently focused on manual verification of core flows

## **Threading Preparation Notes**
- Message schema and types are thread-ready
- Store includes inactive thread support
- UI components structured for future thread integration
- Full threading implementation deferred to post-MVP
- See SDD section 3.2.2.7 for detailed preparation strategy

