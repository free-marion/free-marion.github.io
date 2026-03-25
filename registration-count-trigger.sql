-- 1. Add registered_count column to tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registered_count INTEGER DEFAULT 0;

-- 2. Backfill existing data
UPDATE tournaments t
SET registered_count = (
  SELECT COUNT(*) FROM tournament_registrations tr
  WHERE tr.tournament_id = t.id AND tr.status = 'confirmed'
);

-- 3. Trigger function
CREATE OR REPLACE FUNCTION sync_tournament_registered_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'confirmed' THEN
      UPDATE tournaments SET registered_count = registered_count + 1 WHERE id = NEW.tournament_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE tournaments SET registered_count = registered_count + 1 WHERE id = NEW.tournament_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      UPDATE tournaments SET registered_count = GREATEST(0, registered_count - 1) WHERE id = NEW.tournament_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'confirmed' THEN
      UPDATE tournaments SET registered_count = GREATEST(0, registered_count - 1) WHERE id = OLD.tournament_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger
DROP TRIGGER IF EXISTS trg_tournament_registered_count ON tournament_registrations;
CREATE TRIGGER trg_tournament_registered_count
AFTER INSERT OR UPDATE OR DELETE ON tournament_registrations
FOR EACH ROW EXECUTE FUNCTION sync_tournament_registered_count();
