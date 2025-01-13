import React from 'react';
import { useUsers } from './useUsers';

export function UserList() {
  const { isLoading, error, users } = useUsers();
  const allUsers = Object.values(users);

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {allUsers.map((user) => (
        <li key={user.id}>{user.email}</li>
      ))}
    </ul>
  );
} 