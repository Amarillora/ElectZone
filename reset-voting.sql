-- =============================================
-- RESET VOTING SYSTEM
-- This will clear all votes and reset voter status
-- =============================================

-- 1. Delete all votes
DELETE FROM public.votes;

-- 2. Reset all voters' has_voted status to FALSE
UPDATE public.voters SET has_voted = FALSE;

-- 3. Verify reset
SELECT 
    (SELECT COUNT(*) FROM public.votes) as total_votes,
    (SELECT COUNT(*) FROM public.voters WHERE has_voted = TRUE) as voters_who_voted,
    (SELECT COUNT(*) FROM public.voters WHERE has_voted = FALSE) as voters_ready;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Voting system reset successfully!';
    RAISE NOTICE '- All votes deleted';
    RAISE NOTICE '- All voters can vote again';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now test voting with any student ID (e.g., 2021001)';
END $$;
