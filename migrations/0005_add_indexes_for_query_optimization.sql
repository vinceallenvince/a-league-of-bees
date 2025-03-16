-- Migration to add indexes for optimizing common query patterns
-- This migration addresses ALOB-7: Database Query Optimization

-- Indexes for tournaments table
-- Optimize queries that filter by status and date
CREATE INDEX idx_tournaments_status ON tournaments (status);
CREATE INDEX idx_tournaments_start_date ON tournaments (start_date);
CREATE INDEX idx_tournaments_status_start_date ON tournaments (status, start_date);
CREATE INDEX idx_tournaments_creator_id ON tournaments (creator_id);

-- Indexes for tournament_participants table
-- Optimize lookup by tournament_id and user_id combinations
CREATE INDEX idx_tournament_participants_user_id ON tournament_participants (user_id);
CREATE INDEX idx_tournament_participants_tournament_id ON tournament_participants (tournament_id);
CREATE INDEX idx_tournament_participants_tournament_user ON tournament_participants (tournament_id, user_id);
CREATE INDEX idx_tournament_participants_status ON tournament_participants (status);
CREATE INDEX idx_tournament_participants_tournament_status ON tournament_participants (tournament_id, status);

-- Indexes for tournament_scores table
-- Optimize score lookups and leaderboard queries
CREATE INDEX idx_tournament_scores_tournament_id ON tournament_scores (tournament_id);
CREATE INDEX idx_tournament_scores_user_id ON tournament_scores (user_id);
CREATE INDEX idx_tournament_scores_tournament_day ON tournament_scores (tournament_id, day);
CREATE INDEX idx_tournament_scores_tournament_score_desc ON tournament_scores (tournament_id, score DESC);
CREATE INDEX idx_tournament_scores_tournament_user_day ON tournament_scores (tournament_id, user_id, day);

-- Indexes for notifications table
-- Optimize notification fetching and status updates
CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_tournament_id ON notifications (tournament_id);
CREATE INDEX idx_notifications_user_read ON notifications (user_id, read);
CREATE INDEX idx_notifications_type ON notifications (type);
CREATE INDEX idx_notifications_created_at ON notifications (created_at);

-- Composite indexes for notifications to optimize common queries
CREATE INDEX idx_notifications_user_tournament ON notifications (user_id, tournament_id);
CREATE INDEX idx_notifications_user_type_read ON notifications (user_id, type, read);

-- Comment explaining the purpose of each index
COMMENT ON INDEX idx_tournaments_status IS 'Optimizes queries filtering tournaments by status';
COMMENT ON INDEX idx_tournaments_start_date IS 'Optimizes queries filtering tournaments by start date';
COMMENT ON INDEX idx_tournaments_status_start_date IS 'Optimizes queries filtering tournaments by status and start date';
COMMENT ON INDEX idx_tournaments_creator_id IS 'Optimizes queries filtering tournaments by creator_id';

COMMENT ON INDEX idx_tournament_participants_user_id IS 'Optimizes queries filtering participants by user_id';
COMMENT ON INDEX idx_tournament_participants_tournament_id IS 'Optimizes queries filtering participants by tournament_id';
COMMENT ON INDEX idx_tournament_participants_tournament_user IS 'Optimizes queries looking up specific user participation in tournaments';
COMMENT ON INDEX idx_tournament_participants_status IS 'Optimizes queries filtering participants by status';
COMMENT ON INDEX idx_tournament_participants_tournament_status IS 'Optimizes queries filtering participants by tournament and status';

COMMENT ON INDEX idx_tournament_scores_tournament_id IS 'Optimizes queries filtering scores by tournament_id';
COMMENT ON INDEX idx_tournament_scores_user_id IS 'Optimizes queries filtering scores by user_id';
COMMENT ON INDEX idx_tournament_scores_tournament_day IS 'Optimizes queries filtering scores by tournament and day';
COMMENT ON INDEX idx_tournament_scores_tournament_score_desc IS 'Optimizes leaderboard queries (ordered by score)';
COMMENT ON INDEX idx_tournament_scores_tournament_user_day IS 'Optimizes queries for specific user scores on specific days';

COMMENT ON INDEX idx_notifications_user_id IS 'Optimizes queries filtering notifications by user_id';
COMMENT ON INDEX idx_notifications_tournament_id IS 'Optimizes queries filtering notifications by tournament_id';
COMMENT ON INDEX idx_notifications_user_read IS 'Optimizes queries for unread notifications for a user';
COMMENT ON INDEX idx_notifications_type IS 'Optimizes queries filtering notifications by type';
COMMENT ON INDEX idx_notifications_created_at IS 'Optimizes queries sorting notifications by creation date';
COMMENT ON INDEX idx_notifications_user_tournament IS 'Optimizes queries for notifications related to specific user and tournament';
COMMENT ON INDEX idx_notifications_user_type_read IS 'Optimizes queries for unread notifications of a specific type for a user'; 