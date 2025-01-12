# Refined Flow Structure

## User Management

### Authentication
- **Sign Up** (email/password)
- **Sign In** (email/password)

### Profile
- **Basic Info** (name, email, avatar)
- **Last Seen** (presence)

## Channel System

### Creation
- **Public Channel:** Creator becomes admin
- **Private Channel:** Creator becomes admin

### Membership
- **Public Channels:** Auto-join on first message
- **Private Channels:**
  - **Access Request Flow**
  - **Direct Invitation** (future)

### Roles
- **Admin:**
  - Can delete channel
  - Can manage members
  - Can approve/deny requests
- **Member:**
  - Can read/write messages
- **(Optional) Moderator/Viewer:**
  - Additional permissions

### Deletion
- **Archive access requests**
- **Delete messages** (cascade)
- **Remove members** (cascade)

### Audit Logs
- **Track all critical actions within channels**

## Messaging System

> **Implementation Note**: The following structure represents our complete data model as implemented in Supabase (see UPDATED-migrations folder). While all tables and relationships are established, some features (like threading) are planned for post-MVP implementation.

### Messages
- **Regular Messages:** (✓ Implemented)
  - Create
  - Read (with pagination)
  - Real-time updates
- **Threaded Messages:** (Designed, Post-MVP)
  - Reply to specific messages
  - Creating threads
  > Note: Threading refers to sub-conversations within messages, similar to Slack's thread feature. The data structure supports this via parent_message_id, but UI implementation is scheduled post-MVP.

### Message Reading State
- **Last Read Tracking:**
  - Store `last_read` timestamp in `channel_members`
  - Update on channel view or explicit read action
  - Used for unread indicators and counts

- **Unread Counts:**
  - Calculate using `get_unread_counts` stored procedure
  - Consider only messages after user's `last_read`
  - Exclude user's own messages
  - Real-time updates via message subscriptions

- **Performance Optimizations:**
  - Index on `messages.created_at`
  - Index on `channel_members.last_read`
  - Stored procedures to encapsulate complex logic
  - Batch updates for multiple channels

- **Related Procedures:**
  - `get_unread_counts`: Calculate unread messages per channel
  - `mark_channel_as_read`: Update last_read timestamp

### File Attachments
- **Upload to storage**
- **Generate restricted public URL**

### Reactions
- **Add reactions to messages**

### Message Editing/Deletion
- **Edit and delete own messages**

### Unread Status
- **Track `last_read_at`**
- **Count unread messages**

## Notifications System

### User Notifications
- **Access request status updates**

### Admin Notifications
- **New access requests**
- **Role change actions**

## Audit Logging

### Audit Logs Table
- **Record actions** like channel creation, member management, access request handling

# Updated Database Interaction Structure

## Entities and Relationships

### Users
- **Fields:** `id`, `email`, `password_hash`, `name`, `avatar_url`, `last_seen`
- **Relationships:**
  - One-to-Many with `channel_members`
  - One-to-Many with `access_requests`
  - One-to-Many with `audit_logs`

### Channels
- **Fields:** `id`, `name`, `is_private`, `created_by`, `created_at`, `description`, `topic`
- **Relationships:**
  - One-to-Many with `channel_members`
  - One-to-Many with `messages`
  - One-to-Many with `access_requests`
  - One-to-Many with `audit_logs`

### Channel_Members
- **Fields:** `id`, `channel_id`, `user_id`, `role`, `joined_at`, `last_read`
- **Relationships:**
  - Many-to-One with `Users`
  - Many-to-One with `Channels`

### Access_Requests
- **Fields:** `id`, `channel_id`, `user_id`, `status`, `created_at`, `updated_at`
- **Relationships:**
  - Many-to-One with `Users`
  - Many-to-One with `Channels`

### Messages
- **Fields:** `id`, `channel_id`, `parent_message_id`, `user_id`, `content`, `created_at`, `edited_at`
- **Relationships:**
  - Many-to-One with `Users`
  - Many-to-One with `Channels`
  - Self-referential for threading

### Reactions
- **Fields:** `id`, `message_id`, `user_id`, `emoji`, `created_at`
- **Relationships:**
  - Many-to-One with `Users`
  - Many-to-One with `Messages`

### Audit_Logs
- **Fields:** `id`, `channel_id`, `action`, `performed_by`, `details`, `timestamp`
- **Relationships:**
  - Many-to-One with `Users`
  - Many-to-One with `Channels`

### Notifications
- **Fields:** `id`, `user_id`, `type`, `message`, `is_read`, `created_at`
- **Relationships:**
  - Many-to-One with `Users`
