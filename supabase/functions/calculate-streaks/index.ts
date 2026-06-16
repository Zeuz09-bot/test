import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface StreakPayload {
  user_id: string;
}

function getPreviousDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

serve(async (req) => {
  try {
    const { user_id }: StreakPayload = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 });
    }

    // Fetch all active habits
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id, current_streak, longest_streak')
      .eq('user_id', user_id)
      .is('deleted_at', null);

    if (habitsError) throw habitsError;

    // Fetch all completed habit logs
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('habit_id, log_date')
      .eq('user_id', user_id)
      .eq('completed', 1)
      .order('log_date', { ascending: false });

    if (logsError) throw logsError;

    const today = new Date().toISOString().split('T')[0];
    const results = [];

    for (const habit of habits || []) {
      const habitLogs = logs?.filter(l => l.habit_id === habit.id) || [];
      if (habitLogs.length === 0) {
        if (habit.current_streak !== 0) {
          await supabase.from('habits').update({ current_streak: 0, updated_at: new Date().toISOString() }).eq('id', habit.id);
        }
        results.push({ id: habit.id, current_streak: 0, longest_streak: habit.longest_streak });
        continue;
      }

      let currentStreak = 0;
      let longestStreak = habit.longest_streak || 0;
      let checkDate = today;

      const completedDates = new Set(habitLogs.map(l => l.log_date));

      if (completedDates.has(today)) {
        currentStreak++;
        checkDate = getPreviousDay(today);
      } else {
        const yesterday = getPreviousDay(today);
        if (completedDates.has(yesterday)) {
          currentStreak++;
          checkDate = getPreviousDay(yesterday);
        }
      }

      if (currentStreak > 0) {
        while (completedDates.has(checkDate)) {
          currentStreak++;
          checkDate = getPreviousDay(checkDate);
        }
      }

      let currentLongestCount = 0;
      let tempStreak = 0;
      let lastDate: string | null = null;

      const sortedUniqueDates = Array.from(completedDates).sort();

      for (const dateStr of sortedUniqueDates) {
        if (!lastDate) {
          tempStreak = 1;
        } else {
          const expectedPrev = getPreviousDay(dateStr);
          if (lastDate === expectedPrev) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        currentLongestCount = Math.max(currentLongestCount, tempStreak);
        lastDate = dateStr;
      }

      longestStreak = Math.max(longestStreak, currentLongestCount);

      if (habit.current_streak !== currentStreak || habit.longest_streak !== longestStreak) {
        await supabase
          .from('habits')
          .update({ current_streak: currentStreak, longest_streak: longestStreak, updated_at: new Date().toISOString() })
          .eq('id', habit.id);
      }

      results.push({ id: habit.id, current_streak: currentStreak, longest_streak: longestStreak });
    }

    return new Response(JSON.stringify({ updated: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
