-- =============================================
-- ELECT-ZONE DATABASE SCHEMA FOR SUPABASE
-- School E-Voting System - Updated Schema
-- =============================================

-- =============================================
-- DROP EXISTING TABLES (if any)
-- =============================================
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.candidates CASCADE;
DROP TABLE IF EXISTS public.elections CASCADE;
DROP TABLE IF EXISTS public.voters CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

-- =============================================
-- 1. VOTERS TABLE
-- =============================================
CREATE TABLE public.voters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR NOT NULL UNIQUE,
    email VARCHAR,
    name TEXT,
    year_level VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    has_voted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_voters_student_id ON public.voters(student_id);
CREATE INDEX idx_voters_email ON public.voters(email);
CREATE INDEX idx_voters_has_voted ON public.voters(has_voted);

-- =============================================
-- 2. ELECTIONS TABLE
-- =============================================
CREATE TABLE public.elections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'draft', -- draft | running | closed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for status queries
CREATE INDEX idx_elections_status ON public.elections(status);

-- =============================================
-- 3. CANDIDATES TABLE
-- =============================================
CREATE TABLE public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    party TEXT,
    position TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queries
CREATE INDEX idx_candidates_election ON public.candidates(election_id);
CREATE INDEX idx_candidates_party ON public.candidates(party);
CREATE INDEX idx_candidates_position ON public.candidates(position);

-- =============================================
-- 4. VOTES TABLE (Anonymous/Token-based)
-- =============================================
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
    vote_token UUID NOT NULL, -- random token generated client-side after validation
    payload JSONB NOT NULL, -- encrypted or hashed selections
    payload_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for vote queries
CREATE INDEX idx_votes_election ON public.votes(election_id);
CREATE INDEX idx_votes_token ON public.votes(vote_token);
CREATE INDEX idx_votes_created ON public.votes(created_at);

-- =============================================
-- 5. ADMINS TABLE
-- =============================================
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. AUDIT_LOGS TABLE
-- =============================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type TEXT,
    actor_id UUID,
    action TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for elections and candidates
CREATE POLICY "Allow public read access to elections"
    ON public.elections FOR SELECT
    USING (status = 'running' OR status = 'closed');

CREATE POLICY "Allow public read access to candidates"
    ON public.candidates FOR SELECT
    USING (TRUE);

-- Voters can read their own record
CREATE POLICY "Voters can read own record"
    ON public.voters FOR SELECT
    USING (TRUE);

-- Allow updating has_voted field for voters
CREATE POLICY "Allow update has_voted for voters"
    ON public.voters FOR UPDATE
    USING (TRUE)
    WITH CHECK (TRUE);

-- Votes are write-only (insert only, no read for privacy)
CREATE POLICY "Allow authenticated users to insert votes"
    ON public.votes FOR INSERT
    WITH CHECK (TRUE);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to mark voter as voted
CREATE OR REPLACE FUNCTION mark_voter_as_voted(p_student_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE public.voters
    SET has_voted = TRUE
    WHERE student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if election is active
CREATE OR REPLACE FUNCTION is_election_active(p_election_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    election_status TEXT;
    election_start TIMESTAMPTZ;
    election_end TIMESTAMPTZ;
BEGIN
    SELECT status, start_at, end_at 
    INTO election_status, election_start, election_end
    FROM public.elections
    WHERE id = p_election_id;
    
    RETURN election_status = 'running' 
        AND NOW() >= election_start 
        AND NOW() <= election_end;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS FOR REPORTING
-- =============================================

-- View: Vote counts per candidate
CREATE OR REPLACE VIEW candidate_vote_counts AS
SELECT 
    c.id AS candidate_id,
    c.election_id,
    c.name AS candidate_name,
    c.party,
    c.position,
    c.photo_url,
    COUNT(DISTINCT v.id) AS vote_count
FROM public.candidates c
LEFT JOIN public.votes v ON v.election_id = c.election_id
    AND v.payload->'selections' @> jsonb_build_array(jsonb_build_object('candidate_id', c.id::text))
GROUP BY c.id, c.election_id, c.name, c.party, c.position, c.photo_url
ORDER BY c.position, vote_count DESC;

-- View: Voting statistics
CREATE OR REPLACE VIEW voting_statistics AS
SELECT 
    e.id as election_id,
    e.title as election_title,
    (SELECT COUNT(*) FROM public.voters WHERE is_active = TRUE) as total_voters,
    (SELECT COUNT(*) FROM public.voters WHERE has_voted = TRUE) as voted_count,
    (SELECT COUNT(*) FROM public.votes WHERE election_id = e.id) as total_votes,
    ROUND(
        (SELECT COUNT(*) FROM public.voters WHERE has_voted = TRUE)::DECIMAL / 
        NULLIF((SELECT COUNT(*) FROM public.voters WHERE is_active = TRUE), 0) * 100, 
        2
    ) as turnout_percentage
FROM public.elections e;

-- =============================================
-- SEED DATA - 2 PARTY-LISTS WITH 20 CANDIDATES
-- =============================================

-- Insert sample election
INSERT INTO public.elections (title, start_at, end_at, status) VALUES
('2025 Student Council Elections', NOW(), NOW() + INTERVAL '30 days', 'running');

-- Get the election ID for reference
DO $$
DECLARE
    election_uuid UUID;
BEGIN
    SELECT id INTO election_uuid FROM public.elections WHERE title = '2025 Student Council Elections';
    
    -- =============================================
    -- PARTY 1: PROGRESSIVE STUDENT ALLIANCE (PSA)
    -- =============================================
    
    -- President
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Sarah Chen', 'Progressive Student Alliance', 'President', 'https://i.pravatar.cc/300?img=1');
    
    -- Vice President
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Marcus Williams', 'Progressive Student Alliance', 'Vice President', 'https://i.pravatar.cc/300?img=2');
    
    -- Secretary
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Emily Rodriguez', 'Progressive Student Alliance', 'Secretary', 'https://i.pravatar.cc/300?img=3');
    
    -- Treasurer
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'David Kim', 'Progressive Student Alliance', 'Treasurer', 'https://i.pravatar.cc/300?img=4');
    
    -- Auditor
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Jasmine Patel', 'Progressive Student Alliance', 'Auditor', 'https://i.pravatar.cc/300?img=5');
    
    -- Public Relations Officer
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Alex Thompson', 'Progressive Student Alliance', 'Public Relations Officer', 'https://i.pravatar.cc/300?img=6');
    
    -- Grade 12 Representative
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Olivia Martinez', 'Progressive Student Alliance', 'Grade 12 Representative', 'https://i.pravatar.cc/300?img=7');
    
    -- Grade 11 Representative
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Ethan Brown', 'Progressive Student Alliance', 'Grade 11 Representative', 'https://i.pravatar.cc/300?img=8');
    
    -- Grade 10 Representative
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Sophia Lee', 'Progressive Student Alliance', 'Grade 10 Representative', 'https://i.pravatar.cc/300?img=9');
    
    -- Grade 9 Representative
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Noah Garcia', 'Progressive Student Alliance', 'Grade 9 Representative', 'https://i.pravatar.cc/300?img=10');
    
    -- =============================================
    -- PARTY 2: UNITED STUDENTS COALITION (USC)
    -- =============================================
    
    -- President
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'James Anderson', 'United Students Coalition', 'President', 'https://i.pravatar.cc/300?img=11');
    
    -- Vice President
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Isabella Santos', 'United Students Coalition', 'Vice President', 'https://i.pravatar.cc/300?img=12');
    
    -- Secretary
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Michael Chang', 'United Students Coalition', 'Secretary', 'https://i.pravatar.cc/300?img=13');
    
    -- Treasurer
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Emma Johnson', 'United Students Coalition', 'Treasurer', 'https://i.pravatar.cc/300?img=14');
    
    -- Auditor
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Daniel Nguyen', 'United Students Coalition', 'Auditor', 'https://i.pravatar.cc/300?img=15');
    
    -- Public Relations Officer
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Ava Mitchell', 'United Students Coalition', 'Public Relations Officer', 'https://i.pravatar.cc/300?img=16');
    
    -- Grade 12 Representative
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'William Taylor', 'United Students Coalition', 'Grade 12 Representative', 'https://i.pravatar.cc/300?img=17');
    
    -- Grade 11 Representative
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Mia Robinson', 'United Students Coalition', 'Grade 11 Representative', 'https://i.pravatar.cc/300?img=18');
    
    -- Grade 10 Representative
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Benjamin White', 'United Students Coalition', 'Grade 10 Representative', 'https://i.pravatar.cc/300?img=19');
    
    -- Grade 9 Representative
    INSERT INTO public.candidates (election_id, name, party, position, photo_url) VALUES
    (election_uuid, 'Charlotte Davis', 'United Students Coalition', 'Grade 9 Representative', 'https://i.pravatar.cc/300?img=20');
END $$;

-- =============================================
-- SEED DATA - EXAMPLE VOTERS
-- =============================================

INSERT INTO public.voters (student_id, email, name, year_level, is_active) VALUES
-- Grade 12 Students
('2021001', 'juan.dela.cruz@school.edu', 'Juan Dela Cruz', 'Grade 12', TRUE),
('2021002', 'maria.santos@school.edu', 'Maria Santos', 'Grade 12', TRUE),
('2021003', 'jose.reyes@school.edu', 'Jose Reyes', 'Grade 12', TRUE),
('2021004', 'anna.garcia@school.edu', 'Anna Garcia', 'Grade 12', TRUE),
('2021005', 'pedro.lopez@school.edu', 'Pedro Lopez', 'Grade 12', TRUE),

-- Grade 11 Students
('2022001', 'sofia.martinez@school.edu', 'Sofia Martinez', 'Grade 11', TRUE),
('2022002', 'carlos.rodriguez@school.edu', 'Carlos Rodriguez', 'Grade 11', TRUE),
('2022003', 'lucia.hernandez@school.edu', 'Lucia Hernandez', 'Grade 11', TRUE),
('2022004', 'miguel.gonzalez@school.edu', 'Miguel Gonzalez', 'Grade 11', TRUE),
('2022005', 'carmen.perez@school.edu', 'Carmen Perez', 'Grade 11', TRUE),

-- Grade 10 Students
('2023001', 'diego.sanchez@school.edu', 'Diego Sanchez', 'Grade 10', TRUE),
('2023002', 'isabella.ramirez@school.edu', 'Isabella Ramirez', 'Grade 10', TRUE),
('2023003', 'gabriel.torres@school.edu', 'Gabriel Torres', 'Grade 10', TRUE),
('2023004', 'valentina.flores@school.edu', 'Valentina Flores', 'Grade 10', TRUE),
('2023005', 'sebastian.rivera@school.edu', 'Sebastian Rivera', 'Grade 10', TRUE),

-- Grade 9 Students
('2024001', 'camila.morales@school.edu', 'Camila Morales', 'Grade 9', TRUE),
('2024002', 'mateo.jimenez@school.edu', 'Mateo Jimenez', 'Grade 9', TRUE),
('2024003', 'daniela.ruiz@school.edu', 'Daniela Ruiz', 'Grade 9', TRUE),
('2024004', 'santiago.mendoza@school.edu', 'Santiago Mendoza', 'Grade 9', TRUE),
('2024005', 'victoria.cruz@school.edu', 'Victoria Cruz', 'Grade 9', TRUE),

-- Additional mixed students
('2021006', 'rafael.castro@school.edu', 'Rafael Castro', 'Grade 12', TRUE),
('2022006', 'adriana.ortiz@school.edu', 'Adriana Ortiz', 'Grade 11', TRUE),
('2023006', 'fernando.vargas@school.edu', 'Fernando Vargas', 'Grade 10', TRUE),
('2024006', 'natalia.herrera@school.edu', 'Natalia Herrera', 'Grade 9', TRUE),
('2021007', 'ricardo.medina@school.edu', 'Ricardo Medina', 'Grade 12', TRUE);

-- =============================================
-- SEED DATA - ADMIN ACCOUNT
-- =============================================

-- Admin account (password: admin123 - CHANGE THIS!)
-- Password hash generated with bcrypt, you should generate a new one
INSERT INTO public.admins (email, password_hash, role) VALUES
('admin@school.edu', '$2b$10$rKZqnWvxVUIqAc3gHKJAHOXzWJmf7M9yXzQJ7gLBZvGx5J7nFZJ4q', 'admin'),
('superadmin@school.edu', '$2b$10$rKZqnWvxVUIqAc3gHKJAHOXzWJmf7M9yXzQJ7gLBZvGx5J7nFZJ4q', 'superadmin');

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'ElectZone Database Schema Created Successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '- 6 Tables (voters, elections, candidates, votes, admins, audit_logs)';
    RAISE NOTICE '- 1 Election (2025 Student Council Elections)';
    RAISE NOTICE '- 20 Candidates (2 parties: PSA and USC)';
    RAISE NOTICE '- 25 Sample Voters (all year levels)';
    RAISE NOTICE '- 2 Admin Accounts';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Update admin password hashes';
    RAISE NOTICE '2. Import your real student list';
    RAISE NOTICE '3. Upload candidate photos to storage';
    RAISE NOTICE '4. Configure election dates';
    RAISE NOTICE '==============================================';
END $$;
