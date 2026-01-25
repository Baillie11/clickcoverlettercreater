-- Fix shareResponses for existing users
-- Run this in phpMyAdmin SQL tab for your MySQL database

-- Update any NULL or 0 values to 1 (enabled by default)
UPDATE users SET shareResponses = 1 WHERE shareResponses IS NULL OR shareResponses = 0;

-- Verify the update
SELECT id, username, shareResponses FROM users;

-- Check how many responses will be shared
SELECT COUNT(*) as shared_responses_count 
FROM responses r 
INNER JOIN users u ON r.userId = u.id 
WHERE u.shareResponses = 1 AND r.userCreated = 1;
