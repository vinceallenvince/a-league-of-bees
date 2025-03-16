-- Migration to add database views for complex query optimization
-- This migration addresses ALOB-7: Database Query Optimization

-- View: active_tournaments
-- Purpose: Retrieves all active tournaments with their creator information
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

COMMENT ON VIEW active_tournaments IS 'Retrieves all active tournaments with creator information and participant count';

-- View: tournament_leaderboard
-- Purpose: Gets tournament scores ordered by highest score for leaderboard display
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

COMMENT ON VIEW tournament_leaderboard IS 'Aggregates tournament scores for leaderboard display';

-- View: user_tournaments
-- Purpose: Shows all tournaments a user is participating in
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

COMMENT ON VIEW user_tournaments IS 'Shows all tournaments a user is participating in with submission stats';

-- View: unread_notifications_summary
-- Purpose: Provides a count of unread notifications by type for each user
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

COMMENT ON VIEW unread_notifications_summary IS 'Summarizes unread notifications by type for each user';

-- View: tournament_daily_stats
-- Purpose: Aggregates score statistics by tournament and day
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

COMMENT ON VIEW tournament_daily_stats IS 'Provides daily statistics for tournament scores'; 