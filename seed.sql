INSERT INTO users (id, email, "otpAttempts", "isAdmin")
VALUES (gen_random_uuid(), 'test@example.com', 0, true)
ON CONFLICT (email) DO NOTHING
RETURNING id; 