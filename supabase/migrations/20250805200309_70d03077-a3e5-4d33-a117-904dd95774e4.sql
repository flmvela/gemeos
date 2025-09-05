-- Add some test concepts for the jazz domain
INSERT INTO concepts (name, description, status, domain_id, teacher_id) VALUES
  ('Jazz Harmony', 'Understanding chord progressions and harmonic structures in jazz music', 'confirmed', 'jazz', 'ba1a365e-161d-4f76-b572-850443aa3d2c'),
  ('Improvisation', 'The art of spontaneous musical creation within jazz framework', 'ai_suggested', 'jazz', 'ba1a365e-161d-4f76-b572-850443aa3d2c'),
  ('Swing Rhythm', 'The characteristic rhythmic feel that defines swing-style jazz', 'confirmed', 'jazz', 'ba1a365e-161d-4f76-b572-850443aa3d2c'),
  ('Bebop', 'Fast-paced jazz style developed in the 1940s', 'ai_suggested', 'jazz', 'ba1a365e-161d-4f76-b572-850443aa3d2c'),
  ('Blue Notes', 'Flattened notes that give jazz its distinctive sound', 'rejected', 'jazz', 'ba1a365e-161d-4f76-b572-850443aa3d2c'),
  ('Call and Response', 'Musical conversation technique used in jazz', 'confirmed', 'jazz', 'ba1a365e-161d-4f76-b572-850443aa3d2c');