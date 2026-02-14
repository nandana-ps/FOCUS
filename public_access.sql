-- 1. Create a known SINGLE USER ID
-- We'll use a specific UUID so it's consistent across devices
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001') THEN
        INSERT INTO auth.users (id, email)
        VALUES ('00000000-0000-0000-0000-000000000001', 'singleuser@focuslock.app');
    END IF;
END $$;

-- 2. Ensure Profile Exists for this User
INSERT INTO public.profiles (id, email, full_name, settings)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'singleuser@focuslock.app', 
    'Focus Master',
    '{"normal_limit": 60, "exam_start": null, "exam_end": null}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 3. UPDATE POLICIES FOR PUBLIC ACCESS
-- Drop old strict policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_logs;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_logs;
DROP POLICY IF EXISTS "Users can update own usage" ON public.usage_logs;

-- Create OPEN Policies (Allows ANYONE with the Anon Key to Read/Write)
-- Ideally this should be restricted to just our ID, but for simplicity:

CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Update Profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Public Read Usage" ON public.usage_logs FOR SELECT USING (true);
CREATE POLICY "Public Insert Usage" ON public.usage_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Usage" ON public.usage_logs FOR UPDATE USING (true);

-- (Optional: cleanup exams table policies if used)
DROP POLICY IF EXISTS "Users can view own exams" ON public.exams;
DROP POLICY IF EXISTS "Users can insert own exams" ON public.exams;
DROP POLICY IF EXISTS "Users can delete own exams" ON public.exams;

CREATE POLICY "Public Read Exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Public Insert Exams" ON public.exams FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Exams" ON public.exams FOR DELETE USING (true);
