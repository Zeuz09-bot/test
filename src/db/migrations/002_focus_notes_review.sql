-- Add tables that were missing in initial migration

-- Focus sessions table (already present but ensure completeness)
-- Already created in 001_initial but we can add indexes or constraints if needed

-- Habit logs table (already present but ensure completeness)
-- Already created in 001_initial

-- Day reviews table (already present but ensure completeness)
-- Already created in 01_initial but we can add indexes

-- Add any additional constraints or triggers

-- Example: Trigger to update updated_at automatically
CREATE TRIGGER IF NOT EXISTS update_updated_at
AFTER UPDATE ON goals
BEGIN
  UPDATE goals SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_updated_at_tasks
AFTER UPDATE ON tasks
BEGIN
  UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Add foreign key constraints if not present
ALTER TABLE habits ADD COLUMN goal_id TEXT REFERENCES goals(id);
ALTER TABLE tasks ADD COLUMN goal_id TEXT REFERENCES goals(id);
ALTER TABLE notes ADD COLUMN goal_id TEXT REFERENCES goals(id);