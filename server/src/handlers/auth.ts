import { db } from '../db';
import { usersTable, sessionsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { type LoginInput, type LoginResponse, type User, type Session } from '../schema';

// Simple password hashing using built-in crypto (fallback without bcrypt)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_key_totalindo');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
};

const generateSessionId = (): string => {
  return crypto.randomUUID();
};

export const login = async (input: LoginInput): Promise<LoginResponse> => {
  try {
    // Find user by username
    const users = await db.select()
      .from(usersTable)
      .where(and(
        eq(usersTable.username, input.username),
        eq(usersTable.is_active, true)
      ))
      .execute();

    if (users.length === 0) {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await verifyPassword(input.password, user.password_hash);
    if (!isValidPassword) {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }

    // Create session
    const sessionId = generateSessionId();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8); // 8 hour session

    await db.insert(sessionsTable)
      .values({
        id: sessionId,
        user_id: user.id,
        expires_at: expiresAt
      })
      .execute();

    // Clean up user object (remove password_hash)
    const safeUser: User = {
      id: user.id,
      username: user.username,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return {
      success: true,
      sessionId,
      user: safeUser
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const logout = async (sessionId: string): Promise<{ success: boolean }> => {
  try {
    await db.delete(sessionsTable)
      .where(eq(sessionsTable.id, sessionId))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

export const validateSession = async (sessionId: string): Promise<{ user: User | null }> => {
  try {
    const sessions = await db.select({
        session: sessionsTable,
        user: usersTable
      })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(sessionsTable.user_id, usersTable.id))
      .where(and(
        eq(sessionsTable.id, sessionId),
        eq(usersTable.is_active, true)
      ))
      .execute();

    if (sessions.length === 0) {
      return { user: null };
    }

    const result = sessions[0];
    
    // Check if session is expired
    if (result.session.expires_at < new Date()) {
      // Clean up expired session
      await db.delete(sessionsTable)
        .where(eq(sessionsTable.id, sessionId))
        .execute();
      return { user: null };
    }

    // Return safe user object
    const safeUser: User = {
      id: result.user.id,
      username: result.user.username,
      role: result.user.role,
      is_active: result.user.is_active,
      created_at: result.user.created_at,
      updated_at: result.user.updated_at
    };

    return { user: safeUser };
  } catch (error) {
    console.error('Session validation failed:', error);
    return { user: null };
  }
};

// Initialize default admin user
export const initializeDefaultUser = async (): Promise<void> => {
  try {
    // Check if admin user already exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, 'admin'))
      .execute();

    if (existingUsers.length === 0) {
      const hashedPassword = await hashPassword('TotalindO465');
      
      await db.insert(usersTable)
        .values({
          username: 'admin',
          password_hash: hashedPassword,
          role: 'admin',
          is_active: true
        })
        .execute();

      console.log('Default admin user created successfully');
    }
  } catch (error) {
    console.error('Failed to initialize default user:', error);
  }
};