import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ScorePayload {
  user_id: string;
  date: string;
}

serve(async (req) => {
  try {
    const { user_id, date }: ScorePayload = await req.json();

    if (!user_id || !date) {
      return new Response(JSON.stringify({ error: 'Missing user_id or date' }), { status: 400 });
    }

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('user_id', user_id)
      .eq('scheduled_date', date)
      .is('deleted_at', null);

    if (tasksError) throw tasksError;

    const tasksTotal = tasks?.length ?? 0;
    const tasksCompleted = tasks?.filter(t => t.status === 'completed').length ?? 0;

    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', user_id)
      .is('deleted_at', null);

    if (habitsError) throw habitsError;

    const { data: habitLogs, error: logsError } = await supabase
      .from('habit_logs')
      .select('habit_id, completed')
      .eq('user_id', user_id)
      .eq('log_date', date);

    if (logsError) throw logsError;

    const habitsTotal = habits?.length ?? 0;
    const habitsCompleted = habitLogs?.filter(l => l.completed === 1).length ?? 0;

    const { data: focusSessions, error: focusError } = await supabase
      .from('focus_sessions')
      .select('actual_minutes')
      .eq('user_id', user_id)
      .eq('completed', 1)
      .gte('created_at', `${date}T00:00:00Z`)
      .lte('created_at', `${date}T23:59:59Z`);

    if (focusError) throw focusError;

    const focusMinutes = focusSessions?.reduce((acc, s) => acc + (s.actual_minutes ?? 0), 0) ?? 0;
    const focusSessionsCount = focusSessions?.length ?? 0;

    let score = 0;
    if (tasksTotal > 0 || habitsTotal > 0 || focusMinutes > 0) {
      const taskScore = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 50 : 25;
      const habitScore = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 35 : 17.5;
      const focusScore = Math.min(focusMinutes / 120, 1) * 15;
      score = Math.round(taskScore + habitScore + focusScore);
    }

    const reviewData = {
      user_id,
      review_date: date,
      tasks_total: tasksTotal,
      tasks_completed: tasksCompleted,
      habits_total: habitsTotal,
      habits_completed: habitsCompleted,
      focus_minutes: focusMinutes,
      focus_sessions: focusSessionsCount,
      score,
    };

    const { data: upsertData, error: upsertError } = await supabase
      .from('day_reviews')
      .upsert(reviewData, { onConflict: 'user_id,review_date' })
      .select()
      .single();

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify(upsertData), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
