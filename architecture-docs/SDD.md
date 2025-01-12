Below is an **expanded System Design Document (SDD)** for Snug (“ChatGenius”), intended to address **potential implementation questions**—including a **new threads feature** for channel messages—in a **simple but robust** manner. This document ensures engineers have **clear technical guidance** and minimal ambiguity while you’re away.

---

# **1. Introduction & Scope**

This SDD details how Snug manages **channels, messages, threads, file sharing, presence**, and **AI auto-responses**. We focus on architectural choices, data models, and interaction flows, emphasizing **threaded messaging** as a new extension of our messaging system.

### 1.1 Goals
1. Provide a **scalable and secure** foundation for Slack-like collaboration.  
2. Integrate threads in messages to reduce clutter and allow context-specific conversations.  
3. Maintain **extensibility** for AI-driven features (e.g., auto-responses, voice/video) without major refactoring.  
4. Ensure **real-time updates** and minimal friction for distributed teams.

### 1.2 Out of Scope
- **Complex AI features** (voice/video synthesis), advanced analytics, or heavier enterprise compliance. These are future expansions.

---

# **2. High-Level Architecture**

Snug uses a **modular** approach:

1. **Frontend**:  
   - **Next.js (React)** with SSR for optimized page loads and interactive components.  
   - **Client-Side** for real-time subscriptions (e.g., messaging, threads) and UI interactions.

2. **Backend**:  
   - **Supabase** (Postgres, Auth, RLS, Storage) for data persistence, real-time updates, and user authentication.  
   - **AI Microservice** (eventual) for auto-response logic, invoked on specific triggers (e.g., @mention + user offline).

3. **Real-Time Layer**:  
   - **Supabase Realtime** handles changes in the `messages` table (including threaded messages) and broadcast updates to subscribed clients.

4. **External Integrations** (Optional / Future):  
   - **Logging/Monitoring**: Tools like Sentry or Datadog.  
   - **Third-Party AI**: GPT-based services or custom LLM deployments.

## 2.1 **State Management & SSR Safety**

### 2.1.1 Zustand Store Architecture
- **Core Pattern**: Server-safe store initialization with hydration handling
  ```typescript
  // Safe store creation pattern
  const createMessageStore = () => {
    let store: StoreApi<MessageStore> | null = null;
    return () => {
      if (typeof window === 'undefined') return createStore(initialState)();
      if (!store) store = createStore(initialState);
      return store();
    };
  };

  // Usage in components
  const useMessageStore = createMessageStore();
  ```

### 2.1.2 SSR Safety Guidelines
1. **Store Initialization**
   - Never initialize stores during SSR phase
   - Use lazy initialization pattern
   - Handle hydration mismatches

2. **Component Integration**
   ```typescript
   function MessageProvider({ children }: { children: ReactNode }) {
     const [isClient, setIsClient] = useState(false);

     useEffect(() => {
       setIsClient(true);
     }, []);

     if (!isClient) {
       return <div>Loading messages...</div>;
     }

     const store = useMessageStore();
     // ... rest of the provider logic
   }
   ```

3. **Subscription Management**
   - Initialize subscriptions only after client-side mount
   - Clean up subscriptions on unmount
   - Handle store updates safely

---

# **3. Detailed Modules**

Below are the **core functional modules**, each describing relevant components and the **threads** integration where applicable.

## 3.1 Channels

### 3.1.1 Overview
- Public or private “rooms” for group discussions.
- **Data** stored in a `channels` table with attributes like `id`, `name`, `is_private`, `created_at`, etc.

### 3.1.2 Functionality
- **Create Channel**: Insert into `channels` table, broadcast creation event.  
- **Join/Invite**: Manage membership in a `channel_members` link table (user_id ↔ channel_id).  
- **Archive** (Optional Phase 2): Mark channel as archived (read-only), preserving messages.

### 3.1.3 Ambiguities & Clarifications
- **Duplicate Names**: We enforce unique channel names to reduce confusion.  
- **Private Channels**: Only visible to invited members; presence in `channel_members` is required.

---

## 3.2 Messaging & Threads

### 3.2.1 Message Overview
- Messages are stored in a single `messages` table, referencing **either**:
  1. A **channel_id** (for channel messages)  
  2. A **parent_message_id** (for threaded replies)  
  3. A **user_id** (the author), plus timestamp, text, etc.

### 3.2.2 Threads: Simple but Robust Implementation

#### 3.2.2.1 Data Model
1. **messages** table (key columns):  
   - `id` (PK): Unique message identifier.  
   - `channel_id` (nullable): If present, it’s a top-level message in that channel.  
   - `parent_message_id` (nullable): If present, it’s a “child” message that belongs to a thread under the specified parent message.  
   - `text`: The message content.  
   - `user_id`: The author.  
   - `created_at`: Timestamp of creation.

2. **Threading Logic**:
   - If `parent_message_id` is **null**, the message is **top-level** in the channel.  
   - If `parent_message_id` is **not null**, it’s part of a thread.  
   - **Threads** are effectively sub-discussions linked to a single “parent” message.  

3. **Example**:
   ```
   // Top-level message (thread starter)
   id: 101, channel_id: 1, parent_message_id: null, text: "This is a new topic", user_id: 12

   // Replies (thread messages)
   id: 102, channel_id: null, parent_message_id: 101, text: "Replying to 101", user_id: 14
   id: 103, channel_id: null, parent_message_id: 101, text: "Another reply", user_id: 20
   ```

#### 3.2.2.2 Retrieving Threads
- **UI** can fetch a thread by querying all messages with `parent_message_id` = **the parent’s `id`**.
- The **parent** message itself can also be included to display context.  
- For a channel view, the client typically fetches all messages with `channel_id = X` AND `parent_message_id = null`. This keeps the main feed uncluttered. A user can expand a thread on a specific parent message to see replies.

#### 3.2.2.3 Real-Time Subscription
- **Supabase** real-time subscription on `messages` table:  
  - When a new row with `parent_message_id = X` is inserted, clients subscribed to the thread or the channel can be notified.  
  - The UI decides how to handle these updates (inline expansion, side panel, etc.).

#### 3.2.2.4 Edge Cases
- **Thread Deletion**: Currently, we may not implement message deletion or editing. If introduced later, we must decide how to handle a deleted parent message (or keep a “soft-deleted” placeholder).  
- **Thread in Another Channel?** Not allowed. A thread’s parent must exist in a single channel, so children can’t belong to multiple channels.

### 3.2.3 General Messaging Flow
1. **Send Message**: Client calls an API or directly inserts into Supabase.  
2. **Supabase** notifies all real-time subscribers to `channel_id = X` or `parent_message_id = Y`.  
3. **Clients** update the UI, appending the new message to the correct location (channel feed or thread view).

### 3.2.2.5 Thread Implementation Details
- **Definition**: Threads are sub-conversations attached to specific messages
- **User Flow**:
  1. User clicks "Reply in Thread" on any message
  2. Opens thread view (side panel or modal)
  3. Replies are linked to original message via `parent_message_id`
- **UI Components**:
  ```typescript
  // Thread view structure
  <ThreadView>
    <ParentMessage message={parentMessage} />
    <ThreadReplies parentId={parentMessage.id} />
    <ThreadInput parentId={parentMessage.id} />
  </ThreadView>
  ```

### 3.2.2.6 Component Migration (ChatBubble → Standalone)
- **Previous**: Extended ChatBubble component with message features
- **Current**: Standalone Message component for better control
- **Migration Path**:
  1. Create new `Message` component with direct styling
  2. Implement message features without ChatBubble dependency
  3. Replace old imports systematically:
     ```typescript
     // Old usage
     import { ChatBubble } from '@/components/ui/ChatBubble';
     
     // New usage
     import { Message } from '@/components/messages/Message';
     ```
  4. Remove ChatBubble dependencies after migration

### 3.2.2.7 Threading Preparation Strategy
- **Current State**: Threading UI implementation is deferred to post-MVP, but system is designed for seamless future integration.

#### Data Layer Preparation
```typescript
// Message type structure (ready for threading)
interface Message {
  id: string;
  channel_id: string;
  parent_message_id: string | null;  // Critical for threading
  thread_participant_ids?: string[]; // Optional enhancement
  reply_count?: number;             // Optional enhancement
  content: string;
  created_at: string;
  // ... other fields
}

// Store structure (thread-ready)
interface MessageStore {
  messages: Record<string, Message>;
  channelMessages: Record<string, string[]>;
  threadMessages: Record<string, string[]>;  // Ready for future use
}
```

#### Store Implementation Guidelines
```typescript
// Prepare thread-ready store structure
const useMessageStore = create<MessageStore>((set, get) => ({
  // Current MVP implementation
  messages: {},
  channelMessages: {},
  threadMessages: {},  // Reserved for future use

  // Thread-ready actions (inactive in MVP)
  addThreadMessage: (message: Message) => {
    // Implementation deferred
    console.warn('Threading not yet implemented');
  },

  getThreadMessages: (parentId: string) => {
    // Implementation deferred
    return [];
  }
}));
```

#### Subscription Pattern
```typescript
// Real-time subscription structure
function useMessageSubscription(channelId: string) {
  useEffect(() => {
    const subscription = supabase
      .from('messages')
      .on('INSERT', (payload) => {
        // Handle both regular and future thread messages
        if (payload.new.channel_id === channelId) {
          addMessage(payload.new);
        }
        // Structure ready for future thread messages
        if (payload.new.parent_message_id) {
          // Will be implemented in threading phase
        }
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [channelId]);
}
```

#### UI Component Preparation
```typescript
// Message component with thread awareness
function Message({ message }: { message: Message }) {
  return (
    <div className="message">
      <div className="message-content">{message.content}</div>
      
      {/* Thread UI placeholder - inactive in MVP */}
      {message.reply_count > 0 && (
        <div className="thread-indicator-placeholder" />
      )}
    </div>
  );
}
```

### 3.2.2.8 Future Threading Implementation Path
1. **Data Layer** (Already Prepared):
   - Schema includes `parent_message_id`
   - Types support thread-related fields
   - Store structure accommodates thread data

2. **UI Implementation** (Future Phase):
   - Activate thread indicators
   - Implement ThreadView component
   - Add thread reply functionality
   - Enable thread-specific subscriptions

3. **Route Structure** (Future Phase):
   - Implement `/channels/[channelId]/messages/[messageId]/thread`
   - Add thread-specific navigation
   - Handle thread state management

4. **Migration Steps**:
   ```typescript
   // 1. Activate thread store methods
   addThreadMessage: (message: Message) => set((state) => ({
     messages: { ...state.messages, [message.id]: message },
     threadMessages: {
       ...state.threadMessages,
       [message.parent_message_id]: [
         ...(state.threadMessages[message.parent_message_id] || []),
         message.id
       ]
     }
   }));

   // 2. Implement thread components
   // 3. Enable thread subscriptions
   // 4. Add thread-specific routes
   ```

---

## 3.3 Presence

- **Purpose**: Show online/offline/idle states.  
- **Implementation**:  
  1. `presence` table or ephemeral presence updates.  
  2. **Idle** after X minutes without activity; **Offline** after Y minutes or explicit sign-out.  
- **Thread Impact**: Presence data is channel-wide, not thread-specific. However, a user can watch a specific thread if desired.

---

## 3.4 File Upload & Previews

- **Flow**:
  1. User drags an image into the chat (channel or thread).  
  2. Client verifies file size/type before uploading to Supabase Storage.  
  3. On success, a `message` row is created with `file_url`.  
- **Schema**:
  - `messages.file_url` or a separate `attachments` table.  
  - If the file is specifically attached to a **thread**, it references `parent_message_id` or top-level thread ID.
- **Edge Cases**:
  - Large files: Return error message or prompt compression.  
  - Private channels: Restrict file access with RLS.  

---

## 3.5 AI Auto-Response

- **Context**: AI responds if a user is offline and toggled “auto-responder” ON.  
- **Thread Interaction**:  
  - If an @mention occurs in a **thread**, the AI can respond within that thread (the AI message is inserted with `parent_message_id` referencing the same parent as the mention, or replying directly to the mention message).  
- **Performance**:  
  - Keep context to 10–20 relevant messages (thread or channel).  
- **Privacy**:  
  - Must ensure the AI only reads messages from channels/threads the user has access to.

---

# **4. Database Schema**

A simplified ERD (Entity Relationship Diagram) illustrating key tables:

```
   +-----------+       +---------------+
   | channels  |       | channel_members|
   +-----------+       +---------------+
   | id (PK)   | 1   * | channel_id (FK)
   | name      |<------| user_id (FK)  
   | is_private|       +---------------+
   +-----------+

   +----------------+
   | messages       |
   +----------------+
   | id (PK)        |
   | channel_id (FK)|
   | parent_message_id (FK) -> messages.id
   | user_id (FK)   |
   | text           |
   | file_url       |
   | created_at     |
   +----------------+
```

### 4.1 **Key Points**
- **messages.channel_id** is `NULL` when the message is purely a threaded reply (i.e., `parent_message_id` is set).  
- If a message has `channel_id` **AND** `parent_message_id` = **NULL**, it’s a **top-level** message in a channel.  
- If a message has `parent_message_id` = **not null**, it’s part of a thread (the `channel_id` might be null or match the parent’s channel to enforce data integrity—implementation detail to decide).  
- For real-time subscriptions, we can subscribe to “all messages where `channel_id = X` or `parent_message_id` belongs to messages in `channel_id = X`.”

---

# **5. Data Flows**

## 5.1 Thread Creation

1. **User clicks “Reply to Thread”** on a top-level message with `id = 101`.  
2. **Client** opens a thread view or side panel, allowing the user to type a reply.  
3. **Client** inserts a new row into `messages` with `parent_message_id = 101`.  
4. **Supabase** triggers real-time update to all listeners.  
5. **Other subscribed clients** see the new thread reply appear under the parent.

## 5.2 Thread View Fetch

1. **UI** fetches the parent message (`messages.id = 101`).  
2. **UI** fetches child messages (`messages.parent_message_id = 101`) sorted by `created_at`.  
3. **If real-time**: Subscribes to changes on `parent_message_id = 101`.  

---

# **6. Real-Time & Concurrency**

- **Supabase Realtime** pushes inserts/updates/deletes to all subscribed clients.  
- **Scalability**: Postgres-based pub/sub can handle typical small/medium scale. For **enterprise** with extremely high concurrency, we may need additional solutions or caching layers.

---

# **7. Security & RLS (Row-Level Security)**

1. **Channel Security**:  
   - RLS ensures only channel members can query or insert messages with `channel_id = X`.  
2. **Thread Security**:  
   - If `parent_message_id` belongs to a private channel, the user must be a channel member to see or post replies.  
3. **File Access**:  
   - Supabase Storage uses authenticated endpoints or signed URLs for private channels.  
4. **AI Access**:  
   - The AI microservice must only read data from channels/threads where the user has rights.

---

# **8. Performance & Scalability Considerations**

1. **Thread Growth**: If a single message has hundreds of replies, fetching them might be slow.  
   - *Mitigation*: Use pagination or load replies in batches.  
2. **Indexing**:  
   - Index `channel_id`, `parent_message_id`, and `created_at` to speed up queries.  
3. **Cache Strategy**: Possibly add a short-lived cache for frequently accessed thread data.  
4. **AI Context**: Limit 10–20 messages to keep response times under 2 seconds.

---

# **9. Potential Edge Cases & Implementation Ambiguities**

1. **Nested Threads**:  
   - **Current Decision**: We do **not** allow “threads of threads.” Each thread is a single level, referencing a single parent message. Attempting a nested reply references the same top-level parent.  
2. **Deleted Parent**:  
   - *If or when message deletion is introduced*, decide if child messages become “orphans” or remain accessible with a “deleted” placeholder parent.  
3. **Channel vs. Thread**:  
   - Clarify whether a threaded reply still includes `channel_id` in the DB. If so, ensure it’s consistent with the parent’s channel.  
4. **Search & Threads**:  
   - Searching for text inside a thread must also return relevant parent context. Implementation detail: separate thread views or consolidated results.  

---

# **10. Next Steps & Future Expansions**

1. **Advanced Threading**:  
   - Thread-level notifications, user “follows,” pinned thread replies.  
2. **Threaded File Attachments**:  
   - Dedicated UI for thread attachments.  
3. **AI Thread Summaries**:  
   - Summarize or highlight the entire thread at a glance.  
4. **AI Voice/Video**:  
   - Potential expansions to deliver responses with generated voice or video.

---

# **11. Final Notes**

This **SDD** outlines the **architecture, data structures, and flows** that power Snug’s Slack-like features, **including a new threading system**. By **storing threads in the same `messages` table** (using `parent_message_id`), we achieve a **simple yet robust** approach. Key points to remember:

- **UI Logic** must differentiate between top-level channel messages and threaded replies for **display** and **real-time subscriptions**.  
- **Performance** can be maintained with **indexed queries** and **modest** context sizes for AI.  
- **Security** relies on **Supabase RLS** for channel membership, ensuring only authorized users see or post in private channels/threads.  
- **Edge Cases** (like nested threads) are explicitly out-of-scope to keep the design simpler at this stage.

This SDD will guide the engineering team to implement a **consistent, scalable** system.