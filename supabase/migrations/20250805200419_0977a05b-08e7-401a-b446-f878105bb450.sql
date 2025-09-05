-- Add some test concepts for the jazz domain with valid status values
INSERT INTO concepts (name, description, status, domain_id, teacher_id) VALUES
  ('Jazz Harmony', 'Understanding chord progressions and harmonic structures in jazz music', 'suggested', 'jazz', 'ba1a365e-161d-4f76-b572-850443aa3d2c'),
  ('Improvisation', 'The art of spontaneous musical creation within jazz framework', 'ai_suggested', 'jazz', 'ba1a365e-161d-4f76-b572-850443aa3d2c'),
  ('Swing Rhythm', 'The characteristic rhythmic feel that defines swing-style jazz', 'suggested', 'jazz', 'ba1a365e-161d-4f76-b572-850443aa3d2c'),
  ('Bebop', 'Fast-paced jazz style developed in the 1940s', 'ai_suggested', 'jazz', 'ba1a365e-161d-4f76-b572-850443aa3d2c'),
  ('Call and Response', 'Musical conversation technique used in jazz', 'suggested', 'jazz', 'ba1a365e-161d-4f76-b572-850443aa3d2c');