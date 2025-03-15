
# A League of Bees - Database Migration Guide

## Overview
This document outlines the database migration process for the A League of Bees (ALOB) tournament feature using Drizzle ORM.

## Migration Structure
- Location: `./migrations`
- Config: `drizzle.config.ts`
- Schema: `./shared/schema.ts`

## Running Migrations

### Development Environment
1. Generate migration:
```bash
npm run db:generate
```

2. Push migration:
```bash
npm run db:push
```

### Production Environment
Run migrations automatically during deployment:
```bash
npm run db:migrate
```

## Migration Files

### Existing Tables
- `users`: User account information and authentication
- `adminApprovals`: Admin role approval tracking

### Tournament Tables
- `Tournament`: Main tournament information
- `TournamentParticipant`: Tournament participation records
- `TournamentScore`: Daily score submissions
- `Notification`: System notifications

## Best Practices
1. Always backup database before migrations
2. Test migrations in development first
3. Keep migrations reversible when possible
4. Include descriptive migration names
5. Document breaking changes

## Rollback Process
In case of migration failure:
1. Use the rollback command:
```bash
npm run db:rollback
```
2. Verify database state
3. Fix migration issues
4. Re-run migration

## Troubleshooting
- Check database connection string
- Verify schema compatibility
- Review migration logs
- Ensure proper permissions
