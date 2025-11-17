-- =============================================
-- FIX VOTE COUNTING ISSUE
-- Verify the candidate_vote_counts view is working correctly
-- =============================================

-- First, let's check what's in the votes table
SELECT 
    id,
    election_id,
    vote_token,
    payload,
    created_at
FROM public.votes
ORDER BY created_at DESC
LIMIT 5;

-- Check the payload structure
SELECT 
    id,
    jsonb_pretty(payload) as formatted_payload,
    created_at
FROM public.votes
ORDER BY created_at DESC
LIMIT 3;

-- Verify how many selections each vote has
SELECT 
    id,
    jsonb_array_length(payload->'selections') as selection_count,
    created_at
FROM public.votes
ORDER BY created_at DESC;

-- Check if any votes have missing positions
SELECT 
    v.id as vote_id,
    s.position,
    s.candidate_id
FROM public.votes v
CROSS JOIN LATERAL jsonb_to_recordset(v.payload->'selections') 
    AS s(position text, candidate_id text)
ORDER BY v.created_at DESC;

-- Verify the candidate_vote_counts view is working
SELECT * FROM candidate_vote_counts
WHERE vote_count > 0
ORDER BY position, vote_count DESC;

-- =============================================
-- If you see incomplete votes (less than 10 selections):
-- Delete those incomplete votes
-- =============================================
-- Uncomment and run this if needed:
-- DELETE FROM public.votes 
-- WHERE jsonb_array_length(payload->'selections') < 10;

-- Reset voter status if needed:
-- UPDATE public.voters SET has_voted = FALSE;
