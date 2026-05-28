-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to profiles table
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Apply to tasks table
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get task statistics for a user
CREATE OR REPLACE FUNCTION public.get_task_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'todo', COUNT(*) FILTER (WHERE status = 'todo'),
        'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
        'in_review', COUNT(*) FILTER (WHERE status = 'in_review'),
        'completed', COUNT(*) FILTER (WHERE status = 'completed'),
        'urgent', COUNT(*) FILTER (WHERE priority = 'urgent' AND status != 'completed'),
        'overdue', COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed')
    ) INTO result
    FROM public.tasks
    WHERE created_by = user_uuid OR assigned_to = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
