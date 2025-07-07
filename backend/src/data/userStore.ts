import bcrypt from 'bcryptjs';
import { User } from '@/types';

// Simple in-memory user store for personal use
class UserStore {
  private users: Map<string, User> = new Map();

  constructor() {
    this.seedDefaultUser();
  }

  private async seedDefaultUser(): Promise<void> {
    const username = 'cristal';
    const password = 'HumanizeAI@2025!SecurePassword$ForCristal#NeverGuess';
    
    const passwordHash = await bcrypt.hash(password, 12);
    
    const user: User = {
      id: 'user-cristal-001',
      username,
      passwordHash,
      createdAt: new Date(),
    };

    this.users.set(username, user);
    console.log(`✅ Seeded user: ${username}`);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.get(username) || null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    for (const user of this.users.values()) {
      if (user.id === userId) {
        user.lastLogin = new Date();
        break;
      }
    }
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}

// Singleton instance
export const userStore = new UserStore();
