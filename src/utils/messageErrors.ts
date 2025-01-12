import type { Message } from '@/store/types';

export class MessageValidationError extends Error {
  constructor(
    message: string,
    public field: keyof Message,
    public value: unknown
  ) {
    super(message);
    this.name = 'MessageValidationError';
  }
}

// Type guards for primitive types
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isUUID(value: unknown): value is string {
  if (!isString(value)) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function isTimestamp(value: unknown): value is string {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

// Validate message fields according to Supabase schema
export function validateMessageField(field: keyof Message, value: unknown): boolean {
  switch (field) {
    case 'id':
    case 'channel_id':
    case 'user_id':
    case 'edited_by':
      return isUUID(value);
    
    case 'content':
      return isString(value);
    
    case 'file_url':
    case 'attachment_path':
      return value === null || isString(value);
    
    case 'created_at':
    case 'edited_at':
      return value === null || isTimestamp(value);
    
    case 'user':
      if (!isRecord(value)) return false;
      const user = value as Record<string, unknown>;
      return (
        isUUID(user.id) &&
        isString(user.name) &&
        isString(user.email) &&
        (user.avatar_url === null || isString(user.avatar_url)) &&
        isTimestamp(user.created_at) &&
        (user.last_seen === null || isTimestamp(user.last_seen))
      );
    
    default:
      return false;
  }
}

// Main message validation function
export function validateMessage(data: unknown): asserts data is Message {
  if (!isRecord(data)) {
    throw new MessageValidationError('Invalid message format', 'id', data);
  }

  // Check each required field
  const requiredFields: (keyof Message)[] = [
    'id',
    'content',
    'channel_id',
    'user_id',
    'created_at',
    'user'
  ];

  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new MessageValidationError(`Missing required field: ${field}`, field, undefined);
    }
    if (!validateMessageField(field, data[field])) {
      throw new MessageValidationError(`Invalid ${field}`, field, data[field]);
    }
  }

  // Check optional fields if present
  const optionalFields: (keyof Message)[] = [
    'file_url',
    'attachment_path',
    'edited_at',
    'edited_by'
  ];

  for (const field of optionalFields) {
    if (field in data && !validateMessageField(field, data[field])) {
      throw new MessageValidationError(`Invalid ${field}`, field, data[field]);
    }
  }
} 