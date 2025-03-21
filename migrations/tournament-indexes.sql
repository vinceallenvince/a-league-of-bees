-- Create indexes to optimize tournament-related queries

-- Tournament indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_creator_id ON tournaments(creator_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_status_start_date ON tournaments(status, start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_at ON tournaments(created_at DESC);

-- Tournament participants indexes
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user_id ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_status ON tournament_participants(status);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user_status ON tournament_participants(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_user ON tournament_participants(tournament_id, user_id);

-- Tournament scores indexes
CREATE INDEX IF NOT EXISTS idx_tournament_scores_tournament_id ON tournament_scores(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_scores_user_id ON tournament_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_scores_day ON tournament_scores(day);
CREATE INDEX IF NOT EXISTS idx_tournament_scores_tournament_user ON tournament_scores(tournament_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_scores_tournament_day ON tournament_scores(tournament_id, day);
CREATE INDEX IF NOT EXISTS idx_tournament_scores_tournament_user_day ON tournament_scores(tournament_id, user_id, day);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tournament_id ON notifications(tournament_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_tournament ON notifications(user_id, tournament_id);

-- Create materialized view for active tournaments
CREATE MATERIALIZED VIEW IF NOT EXISTS active_tournaments AS
SELECT 
  t.*,
  u.username as creator_username,
  (SELECT COUNT(*) FROM tournament_participants tp WHERE tp.tournament_id = t.id) as participant_count
FROM tournaments t
JOIN users u ON t.creator_id = u.id
WHERE t.status = 'in_progress'
ORDER BY t.start_date DESC;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_tournaments_id ON active_tournaments(id);

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_active_tournaments()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY active_tournaments;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view when tournaments table changes
CREATE TRIGGER refresh_active_tournaments_trigger
AFTER INSERT OR UPDATE OR DELETE ON tournaments
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_active_tournaments();

-- Create leaderboard materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS tournament_leaderboards AS
SELECT 
  ts.tournament_id,
  ts.user_id,
  u.username,
  SUM(ts.score) as total_score,
  COUNT(ts.id) as scores_submitted,
  MAX(ts.updated_at) as last_updated
FROM tournament_scores ts
JOIN users u ON ts.user_id = u.id
GROUP BY ts.tournament_id, ts.user_id, u.username;

-- Create indexes on leaderboard materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_leaderboards_tournament_user ON tournament_leaderboards(tournament_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_leaderboards_tournament_score ON tournament_leaderboards(tournament_id, total_score DESC);

-- Create refresh function for leaderboard materialized view
CREATE OR REPLACE FUNCTION refresh_tournament_leaderboards()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY tournament_leaderboards;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh leaderboard materialized view when scores change
CREATE TRIGGER refresh_tournament_leaderboards_trigger
AFTER INSERT OR UPDATE OR DELETE ON tournament_scores
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_tournament_leaderboards(); 