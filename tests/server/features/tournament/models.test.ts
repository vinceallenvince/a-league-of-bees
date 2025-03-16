import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { tournaments, users, adminApprovals } from '../../../../shared/schema';
import { testDb as db, setupTestDb, teardownTestDb, cleanupDatabase } from '../../core/test-db';

describe('Tournament Models', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });
  
  beforeEach(async () => {
    // Clean the database before each test to prevent duplicate key errors
    await cleanupDatabase();
  });

  it('should create a tournament with valid data', async () => {
    // Generate a unique email address using a timestamp to prevent conflicts
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    const user = await db.insert(users).values({
      email: uniqueEmail,
      otpAttempts: 0
    }).returning();

    const tournament = await db.insert(tournaments).values({
      creatorId: user[0].id,
      name: 'Test Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    }).returning();

    expect(tournament[0]).toHaveProperty('id');
    expect(tournament[0].name).toBe('Test Tournament');
  });

  it('should enforce foreign key constraint on creator_id', async () => {
    await expect(db.insert(tournaments).values({
      creatorId: '00000000-0000-0000-0000-000000000000',
      name: 'Invalid Tournament',
      durationDays: 7,
      startDate: new Date(),
      timezone: 'UTC',
    })).rejects.toThrow();
  });

  it('should create admin approval with valid data', async () => {
    // Generate a unique email address using a timestamp to prevent conflicts
    const uniqueEmail = `admin-${Date.now()}@example.com`;
    
    const user = await db.insert(users).values({
      email: uniqueEmail,
      otpAttempts: 0
    }).returning();

    const approval = await db.insert(adminApprovals).values({
      userId: user[0].id,
      status: 'pending',
    }).returning();

    expect(approval[0]).toHaveProperty('id');
    expect(approval[0].status).toBe('pending');
  });
});
