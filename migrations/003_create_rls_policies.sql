-- ============================================
-- RLS Policies for profiles table
-- ============================================

-- Anyone authenticated can view all profiles (needed for user assignment dropdown)
CREATE POLICY "Authenticated users can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS Policies for tasks table
-- ============================================

-- Users can view tasks they created or are assigned to
CREATE POLICY "Users can view own and assigned tasks"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (
        auth.uid() = created_by OR
        auth.uid() = assigned_to
    );

-- Users can create tasks
CREATE POLICY "Authenticated users can create tasks"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Task creators can update their tasks
CREATE POLICY "Task creators can update tasks"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Assignees can update task status
CREATE POLICY "Assignees can update task status"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (auth.uid() = assigned_to);

-- Task creators can delete their tasks
CREATE POLICY "Task creators can delete tasks"
    ON public.tasks FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);
