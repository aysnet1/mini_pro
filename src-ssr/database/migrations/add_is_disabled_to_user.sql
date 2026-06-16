
use logement_etudiant5;
ALTER TABLE user 
ADD COLUMN is_disabled TINYINT(1) DEFAULT 0 NOT NULL AFTER role;

-- Add index for better query performance
CREATE INDEX idx_user_is_disabled ON user(is_disabled);

