-- Update domain name from "Jazz music" to "jazz-music" to match GCS naming convention
UPDATE domains 
SET name = 'jazz-music' 
WHERE name = 'Jazz music';