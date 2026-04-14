-- UP
ALTER TABLE meal_logs ADD COLUMN raw_input text;

-- DOWN
ALTER TABLE meal_logs DROP COLUMN raw_input;
