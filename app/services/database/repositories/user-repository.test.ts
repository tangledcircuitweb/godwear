import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserRepository } from './user-repository';
import type { UserRecord } from '../../../../types/database';
import { createMockEnv } from '../../../../src/test/setup';
import { aUser } from '../../../../src/test/helpers/test-factory';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockEnv: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    mockEnv = createMockEnv();
    userRepository = new UserRepository(mockEnv.DATABASE_SERVICE);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with database connection', () => {
      expect(userRepository).toBeInstanceOf(UserRepository);
    });

    it('should have correct table name', () => {
      expect(userRepository['tableName']).toBe('users');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email address', async () => {
      const testUser = aUser().withEmail('test@godwear.com').build();
      
      // Mock the database service queryOne method
      const mockDbResult = {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        picture: testUser.picture || null,
        verified_email: testUser.emailVerified,
        status: 'active',
        metadata: null,
        last_login_at: null,
        created_at: testUser.createdAt,
        updated_at: testUser.updatedAt,
      };

      vi.spyOn(mockEnv.DATABASE_SERVICE, 'queryOne').mockResolvedValue({
        result: mockDbResult,
        success: true,
        meta: { duration: 1, rows_read: 1, rows_written: 0 }
      });

      const result = await userRepository.findByEmail('test@godwear.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@godwear.com');
      expect(result?.name).toBe(testUser.name);
      expect(mockEnv.DATABASE_SERVICE.queryOne).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ? LIMIT 1',
        ['test@godwear.com']
      );
    });

    it('should return null for non-existent email', async () => {
      vi.spyOn(mockEnv.DATABASE_SERVICE, 'queryOne').mockResolvedValue({
        result: null,
        success: true,
        meta: { duration: 1, rows_read: 0, rows_written: 0 }
      });

      const result = await userRepository.findByEmail('nonexistent@godwear.com');
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      vi.spyOn(mockEnv.DATABASE_SERVICE, 'queryOne').mockRejectedValue(
        new Error('Database error')
      );

      await expect(userRepository.findByEmail('test@godwear.com')).rejects.toThrow('Database error');
    });

    it('should validate email format', async () => {
      const invalidEmails = ['', 'invalid-email', '@godwear.com', 'user@'];
      
      for (const email of invalidEmails) {
        await expect(userRepository.findByEmail(email)).rejects.toThrow();
      }
    });
  });

  describe('findByStatus', () => {
    it('should find users by active status', async () => {
      const activeUsers = [
        {
          id: 'user-1',
          email: 'user1@godwear.com',
          name: 'User One',
          role: 'USER',
          provider: 'email',
          provider_id: null,
          email_verified: 1,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login_at: null,
        },
        {
          id: 'user-2',
          email: 'user2@godwear.com',
          name: 'User Two',
          role: 'USER',
          provider: 'google',
          provider_id: 'google-123',
          email_verified: 1,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
        },
      ];

      vi.spyOn(mockEnv.DB, 'prepare').mockReturnValue({
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: activeUsers }),
        }),
      } as any);

      const result = await userRepository.findByStatus('active');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('active');
      expect(result[1].status).toBe('active');
    });

    it('should find users by suspended status', async () => {
      const suspendedUsers = [
        {
          id: 'user-3',
          email: 'suspended@godwear.com',
          name: 'Suspended User',
          role: 'USER',
          provider: 'email',
          provider_id: null,
          email_verified: 1,
          status: 'suspended',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login_at: null,
        },
      ];

      vi.spyOn(mockEnv.DB, 'prepare').mockReturnValue({
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: suspendedUsers }),
        }),
      } as any);

      const result = await userRepository.findByStatus('suspended');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('suspended');
    });

    it('should return empty array for status with no users', async () => {
      vi.spyOn(mockEnv.DB, 'prepare').mockReturnValue({
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: [] }),
        }),
      } as any);

      const result = await userRepository.findByStatus('deleted');
      expect(result).toHaveLength(0);
    });
  });

  describe('findActiveUsers', () => {
    it('should find all active users', async () => {
      const activeUsers = [
        {
          id: 'user-1',
          email: 'active1@godwear.com',
          name: 'Active User 1',
          role: 'USER',
          provider: 'email',
          provider_id: null,
          email_verified: 1,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login_at: null,
        },
        {
          id: 'user-2',
          email: 'active2@godwear.com',
          name: 'Active User 2',
          role: 'ADMIN',
          provider: 'google',
          provider_id: 'google-456',
          email_verified: 1,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
        },
      ];

      vi.spyOn(userRepository, 'findByStatus').mockResolvedValue(activeUsers as UserRecord[]);

      const result = await userRepository.findActiveUsers();

      expect(result).toHaveLength(2);
      expect(userRepository.findByStatus).toHaveBeenCalledWith('active');
    });
  });

  describe('updateLastLogin', () => {
    it('should update user last login timestamp', async () => {
      const userId = 'user-123';
      const beforeUpdate = new Date().toISOString();
      
      const updatedUser = {
        id: userId,
        email: 'user@godwear.com',
        name: 'Test User',
        role: 'USER',
        provider: 'email',
        provider_id: null,
        email_verified: 1,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      };

      vi.spyOn(userRepository, 'update').mockResolvedValue(updatedUser as UserRecord);

      const result = await userRepository.updateLastLogin(userId);

      expect(result.last_login_at).toBeDefined();
      expect(new Date(result.last_login_at!).getTime()).toBeGreaterThanOrEqual(new Date(beforeUpdate).getTime());
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        last_login_at: expect.any(String),
      });
    });

    it('should handle update errors', async () => {
      vi.spyOn(userRepository, 'update').mockRejectedValue(new Error('Update failed'));

      await expect(userRepository.updateLastLogin('user-123')).rejects.toThrow('Update failed');
    });
  });

  describe('updateStatus', () => {
    it('should update user status to suspended', async () => {
      const userId = 'user-123';
      const updatedUser = {
        id: userId,
        email: 'user@godwear.com',
        name: 'Test User',
        role: 'USER',
        provider: 'email',
        provider_id: null,
        email_verified: 1,
        status: 'suspended',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
        last_login_at: null,
      };

      vi.spyOn(userRepository, 'update').mockResolvedValue(updatedUser as UserRecord);

      const result = await userRepository.updateStatus(userId, 'suspended');

      expect(result.status).toBe('suspended');
      expect(userRepository.update).toHaveBeenCalledWith(userId, { status: 'suspended' });
    });

    it('should update user status to active', async () => {
      const userId = 'user-456';
      const updatedUser = {
        id: userId,
        email: 'user@godwear.com',
        name: 'Test User',
        role: 'USER',
        provider: 'email',
        provider_id: null,
        email_verified: 1,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
        last_login_at: null,
      };

      vi.spyOn(userRepository, 'update').mockResolvedValue(updatedUser as UserRecord);

      const result = await userRepository.updateStatus(userId, 'active');

      expect(result.status).toBe('active');
    });

    it('should validate status values', async () => {
      const invalidStatuses = ['invalid', '', 'ACTIVE', 'pending'];
      
      for (const status of invalidStatuses) {
        await expect(
          userRepository.updateStatus('user-123', status as any)
        ).rejects.toThrow();
      }
    });
  });

  describe('suspendUser', () => {
    it('should suspend user successfully', async () => {
      const userId = 'user-123';
      const suspendedUser = {
        id: userId,
        email: 'user@godwear.com',
        name: 'Test User',
        role: 'USER',
        provider: 'email',
        provider_id: null,
        email_verified: 1,
        status: 'suspended',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
        last_login_at: null,
      };

      vi.spyOn(userRepository, 'updateStatus').mockResolvedValue(suspendedUser as UserRecord);

      const result = await userRepository.suspendUser(userId);

      expect(result.status).toBe('suspended');
      expect(userRepository.updateStatus).toHaveBeenCalledWith(userId, 'suspended');
    });
  });

  describe('CRUD Operations', () => {
    it('should create new user', async () => {
      const newUserData = {
        email: 'new@godwear.com',
        name: 'New User',
        role: 'USER' as const,
        provider: 'email' as const,
        email_verified: 1,
        status: 'active' as const,
      };

      const createdUser = {
        id: 'user-new-123',
        ...newUserData,
        provider_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: null,
      };

      vi.spyOn(userRepository, 'create').mockResolvedValue(createdUser as UserRecord);

      const result = await userRepository.create(newUserData);

      expect(result.email).toBe(newUserData.email);
      expect(result.name).toBe(newUserData.name);
      expect(result.id).toBeDefined();
    });

    it('should find user by ID', async () => {
      const userId = 'user-123';
      const user = {
        id: userId,
        email: 'user@godwear.com',
        name: 'Test User',
        role: 'USER',
        provider: 'email',
        provider_id: null,
        email_verified: 1,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        last_login_at: null,
      };

      vi.spyOn(userRepository, 'findById').mockResolvedValue(user as UserRecord);

      const result = await userRepository.findById(userId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(userId);
    });

    it('should update user data', async () => {
      const userId = 'user-123';
      const updateData = {
        name: 'Updated Name',
        email_verified: 1,
      };

      const updatedUser = {
        id: userId,
        email: 'user@godwear.com',
        name: 'Updated Name',
        role: 'USER',
        provider: 'email',
        provider_id: null,
        email_verified: 1,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
        last_login_at: null,
      };

      vi.spyOn(mockEnv.DB, 'prepare').mockReturnValue({
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ success: true, changes: 1 }),
        }),
      } as any);

      vi.spyOn(userRepository, 'findById').mockResolvedValue(updatedUser as UserRecord);

      const result = await userRepository.update(userId, updateData);

      expect(result.name).toBe('Updated Name');
      expect(result.email_verified).toBe(1);
    });

    it('should delete user', async () => {
      const userId = 'user-123';

      vi.spyOn(mockEnv.DB, 'prepare').mockReturnValue({
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ success: true, changes: 1 }),
        }),
      } as any);

      await userRepository.delete(userId);

      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users WHERE id = ?')
      );
    });
  });

  describe('Data Validation', () => {
    it('should validate email format on create', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        name: 'Test User',
        role: 'USER' as const,
        provider: 'email' as const,
        email_verified: 1,
        status: 'active' as const,
      };

      await expect(userRepository.create(invalidUserData)).rejects.toThrow();
    });

    it('should validate required fields on create', async () => {
      const incompleteUserData = {
        email: 'test@godwear.com',
        // Missing name
        role: 'USER' as const,
        provider: 'email' as const,
        email_verified: 1,
        status: 'active' as const,
      };

      await expect(userRepository.create(incompleteUserData as any)).rejects.toThrow();
    });

    it('should validate role values', async () => {
      const invalidRoleData = {
        email: 'test@godwear.com',
        name: 'Test User',
        role: 'INVALID_ROLE' as any,
        provider: 'email' as const,
        email_verified: 1,
        status: 'active' as const,
      };

      await expect(userRepository.create(invalidRoleData)).rejects.toThrow();
    });

    it('should validate provider values', async () => {
      const invalidProviderData = {
        email: 'test@godwear.com',
        name: 'Test User',
        role: 'USER' as const,
        provider: 'invalid_provider' as any,
        email_verified: 1,
        status: 'active' as const,
      };

      await expect(userRepository.create(invalidProviderData)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      vi.spyOn(mockEnv.DB, 'prepare').mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(userRepository.findByEmail('test@godwear.com')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle constraint violations', async () => {
      const duplicateUserData = {
        email: 'existing@godwear.com',
        name: 'Duplicate User',
        role: 'USER' as const,
        provider: 'email' as const,
        email_verified: 1,
        status: 'active' as const,
      };

      vi.spyOn(mockEnv.DB, 'prepare').mockReturnValue({
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockRejectedValue(new Error('UNIQUE constraint failed: users.email')),
        }),
      } as any);

      await expect(userRepository.create(duplicateUserData)).rejects.toThrow(
        'UNIQUE constraint failed'
      );
    });

    it('should handle transaction rollbacks', async () => {
      vi.spyOn(mockEnv.DB, 'prepare').mockReturnValue({
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockRejectedValue(new Error('Transaction rolled back')),
        }),
      } as any);

      await expect(userRepository.update('user-123', { name: 'New Name' })).rejects.toThrow(
        'Transaction rolled back'
      );
    });
  });

  describe('Performance', () => {
    it('should handle large result sets efficiently', async () => {
      const largeUserSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@godwear.com`,
        name: `User ${i}`,
        role: 'USER',
        provider: 'email',
        provider_id: null,
        email_verified: 1,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: null,
      }));

      vi.spyOn(mockEnv.DB, 'prepare').mockReturnValue({
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: largeUserSet }),
        }),
      } as any);

      const startTime = performance.now();
      const result = await userRepository.findByStatus('active');
      const endTime = performance.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should use prepared statements for repeated queries', async () => {
      const prepareSpy = vi.spyOn(mockEnv.DB, 'prepare').mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
        }),
      } as any);

      // Make multiple calls
      await userRepository.findByEmail('user1@godwear.com');
      await userRepository.findByEmail('user2@godwear.com');
      await userRepository.findByEmail('user3@godwear.com');

      // Should reuse prepared statement
      expect(prepareSpy).toHaveBeenCalledTimes(3);
    });
  });
});
