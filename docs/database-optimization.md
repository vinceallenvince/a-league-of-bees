# Database Query Optimization Strategy

This document outlines the database query optimization strategies implemented for the tournament feature of the A League of Bees application.

## Overview

The tournament feature involves several related tables:
- `tournaments` - Stores tournament information
- `tournament_participants` - Tracks users participating in tournaments
- `tournament_scores` - Records scores submitted by users for each tournament day
- `notifications` - Stores notifications related to tournaments

To optimize query performance, we've implemented several strategies:

1. **Strategic Indexing** - Creating indexes on frequently queried columns
2. **Database Views** - Creating views for complex queries to simplify application code
3. **Optimized Query Functions** - TypeScript functions that leverage indexes and views
4. **Performance Testing** - Tests to validate query performance with realistic data volumes

## Indexes

We've added the following indexes to improve query performance:

### Tournament Table Indexes
- `idx_tournaments_status` - Optimizes filtering by status
- `idx_tournaments_start_date` - Optimizes date range filters
- `idx_tournaments_status_start_date` - Optimizes combined status/date filters
- `idx_tournaments_creator_id` - Optimizes lookups by creator

### Tournament Participants Table Indexes
- `idx_tournament_participants_user_id` - Optimizes filtering by user
- `idx_tournament_participants_tournament_id` - Optimizes filtering by tournament
- `idx_tournament_participants_tournament_user` - Optimizes finding specific user participation
- `idx_tournament_participants_status` - Optimizes filtering by status
- `idx_tournament_participants_tournament_status` - Optimizes filtering by tournament and status

### Tournament Scores Table Indexes
- `idx_tournament_scores_tournament_id` - Optimizes filtering by tournament
- `idx_tournament_scores_user_id` - Optimizes filtering by user
- `idx_tournament_scores_tournament_day` - Optimizes filtering by tournament and day
- `idx_tournament_scores_tournament_score_desc` - Optimizes leaderboard queries
- `idx_tournament_scores_tournament_user_day` - Optimizes user-day specific queries

### Notifications Table Indexes
- `idx_notifications_user_id` - Optimizes filtering by user
- `idx_notifications_tournament_id` - Optimizes filtering by tournament
- `idx_notifications_user_read` - Optimizes unread notification queries
- `idx_notifications_type` - Optimizes filtering by notification type
- `idx_notifications_created_at` - Optimizes sorting by creation date
- `idx_notifications_user_tournament` - Optimizes user+tournament specific queries
- `idx_notifications_user_type_read` - Optimizes unread notifications of specific types

## Database Views

We've created the following views to optimize complex queries:

### Active Tournaments View
```sql
CREATE VIEW active_tournaments AS
SELECT 
    t.*,
    u.email as creator_email,
    u.username as creator_username,
    u.firstName as creator_first_name,
    u.lastName as creator_last_name,
    COUNT(DISTINCT tp.id) as participant_count
FROM 
    tournaments t
JOIN 
    users u ON t.creator_id = u.id
LEFT JOIN 
    tournament_participants tp ON t.id = tp.tournament_id
WHERE 
    t.status = 'in_progress'
GROUP BY 
    t.id, u.id;
```

### Tournament Leaderboard View
```sql
CREATE VIEW tournament_leaderboard AS
SELECT 
    ts.tournament_id,
    t.name as tournament_name,
    ts.user_id,
    u.username,
    u.email,
    SUM(ts.score) as total_score,
    MAX(ts.score) as highest_score,
    COUNT(ts.id) as days_participated
FROM 
    tournament_scores ts
JOIN 
    tournaments t ON ts.tournament_id = t.id
JOIN 
    users u ON ts.user_id = u.id
GROUP BY 
    ts.tournament_id, t.name, ts.user_id, u.username, u.email
ORDER BY 
    ts.tournament_id, total_score DESC;
```

### User Tournaments View
```sql
CREATE VIEW user_tournaments AS
SELECT 
    u.id as user_id,
    u.email,
    u.username,
    t.id as tournament_id,
    t.name as tournament_name,
    t.status as tournament_status,
    t.start_date,
    t.duration_days,
    tp.status as participation_status,
    tp.joined_at,
    (
        SELECT COUNT(ts.id) 
        FROM tournament_scores ts 
        WHERE ts.tournament_id = t.id AND ts.user_id = u.id
    ) as score_submissions,
    (
        SELECT SUM(ts.score) 
        FROM tournament_scores ts 
        WHERE ts.tournament_id = t.id AND ts.user_id = u.id
    ) as total_score
FROM 
    users u
JOIN 
    tournament_participants tp ON u.id = tp.user_id
JOIN 
    tournaments t ON tp.tournament_id = t.id;
```

### Notification Summary View
```sql
CREATE VIEW unread_notifications_summary AS
SELECT 
    user_id,
    type,
    COUNT(*) as notification_count
FROM 
    notifications
WHERE 
    read = false
GROUP BY 
    user_id, type;
```

### Tournament Daily Statistics View
```sql
CREATE VIEW tournament_daily_stats AS
SELECT 
    tournament_id,
    day,
    COUNT(DISTINCT user_id) as participants,
    AVG(score) as average_score,
    MAX(score) as highest_score,
    MIN(score) as lowest_score
FROM 
    tournament_scores
GROUP BY 
    tournament_id, day
ORDER BY 
    tournament_id, day;
```

## Optimized Query Functions

We've implemented TypeScript query functions in `server/features/tournament/queries.ts` that:

1. Leverage the indexes and views to ensure optimal query performance
2. Include TypeScript type safety for query results
3. Provide a clean API for tournament-related data access

Examples:
- `getActiveTournaments(page, pageSize)` - Paginated list of active tournaments
- `getTournamentLeaderboard(tournamentId)` - Leaderboard for a specific tournament
- `getUnreadNotifications(userId)` - Unread notifications for a user
- `searchTournaments(searchText)` - Full-text search for tournaments

## Performance Testing

A dedicated performance test suite (`query-performance.test.ts`) has been created to:

1. Generate realistic test data volumes
2. Measure query execution times
3. Validate that queries perform within acceptable time limits
4. Provide a benchmark for future optimizations

## Best Practices for Future Development

When adding new queries or features to the tournament system:

1. **Analyze Query Patterns**: Identify which columns are used in WHERE, JOIN, and ORDER BY clauses
2. **Consider Adding Indexes**: Add indexes for frequently queried columns
3. **Use EXPLAIN**: Use PostgreSQL's EXPLAIN ANALYZE to understand query execution plans
4. **Consider Views**: Create views for complex queries with multiple joins or aggregations
5. **Batch Operations**: Use bulk operations when possible (e.g., updateTournamentParticipantsStatus)
6. **Monitor Performance**: Regularly test query performance with realistic data volumes
7. **Optimize Pagination**: Use proper pagination techniques for large result sets

## Index Maintenance

While indexes improve read performance, they can slow down writes and increase storage. Consider:

1. Periodically reviewing index usage (PostgreSQL provides `pg_stat_user_indexes`)
2. Removing unused indexes
3. Reindexing when necessary

## Conclusion

The implemented optimization strategies provide a strong foundation for the tournament feature's scalability. By following these patterns for future development, the application will maintain good performance as data volume grows. 