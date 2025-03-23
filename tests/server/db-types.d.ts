import type { PgTable } from 'drizzle-orm/pg-core';
import * as schema from '../../shared/schema';

// This module augmentation fixes the typing for our database in test files
declare module '../../server/core/db' {
  // Union type that covers both potential DB implementations
  type DrizzleDB = {
    delete: <T extends PgTable>(table: T) => any;
    insert: <T extends PgTable>(table: T) => any;
    select: () => any;
  };
  
  // Don't redeclare db - just augment its type
  export interface db extends DrizzleDB {}
} 