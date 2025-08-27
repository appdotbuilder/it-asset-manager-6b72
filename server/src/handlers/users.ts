import { db } from '../db';
import { usersTable, sessionsTable } from '../db/schema';
import { eq, ne } from 'drizzle-orm';
import { type CreateUserInput, type User } from '../schema';

// Simple password hashing using built-in crypto (same as auth.ts)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_key_totalindo');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const users = await db.select({
        id: usersTable.id,
        username: usersTable.username,
        role: usersTable.role,
        is_active: usersTable.is_active,
        created_at: usersTable.created_at,
        updated_at: usersTable.updated_at
      })
      .from(usersTable)
      .execute();

    return users;
  } catch (error) {
    console.error('Failed to get users:', error);
    throw error;
  }
};

export const getUserById = async (id: number): Promise<User | null> => {
  try {
    const users = await db.select({
        id: usersTable.id,
        username: usersTable.username,
        role: usersTable.role,
        is_active: usersTable.is_active,
        created_at: usersTable.created_at,
        updated_at: usersTable.updated_at
      })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Failed to get user by id:', error);
    throw error;
  }
};

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Check if username already exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (existingUsers.length > 0) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Insert user
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        password_hash: hashedPassword,
        role: input.role,
        is_active: true
      })
      .returning({
        id: usersTable.id,
        username: usersTable.username,
        role: usersTable.role,
        is_active: usersTable.is_active,
        created_at: usersTable.created_at,
        updated_at: usersTable.updated_at
      })
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};

export const deleteUser = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Don't allow deletion of admin user
    const user = await getUserById(id);
    if (user && user.username === 'admin') {
      throw new Error('Cannot delete the admin user');
    }

    // Delete all user sessions first
    await db.delete(sessionsTable)
      .where(eq(sessionsTable.user_id, id))
      .execute();

    // Delete the user
    await db.delete(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
};