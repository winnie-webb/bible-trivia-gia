-- Migration: Add real-time synchronization fields to rooms table
-- Run this in Supabase SQL Editor

-- Add showing_results field to track when results should be displayed
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS showing_results BOOLEAN DEFAULT false;

-- Add question_end_time to track when the current question timer expires
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS question_end_time TIMESTAMPTZ;

-- Add question_start_time to track when the current question started
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS question_start_time TIMESTAMPTZ;

-- Create or replace function for atomic score increment
-- This prevents race conditions when multiple players finish simultaneously
CREATE OR REPLACE FUNCTION increment_player_score(
  p_room_id UUID,
  p_player_id TEXT,
  p_points INTEGER
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE room_players
  SET score = score + p_points
  WHERE room_id = p_room_id AND player_id = p_player_id;
END;
$$;

-- Optional: Clear existing game data to start fresh
-- Uncomment these lines if you want to reset everything

-- DELETE FROM player_answers;
-- DELETE FROM game_state;
-- DELETE FROM room_players;
-- UPDATE rooms SET status = 'waiting', current_question = 0, showing_results = false;
