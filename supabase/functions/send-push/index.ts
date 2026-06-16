import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PushPayload {
  user_id: string;
  type: 'morning_briefing' | 'evening_review' | 'deadline_alert' | 'habit_reminder' | 'note_reminder';
  data: Record<string, unknown>;
}

serve(async (req) => {
  const { user_id, type, data }: PushPayload = await req.json();

  const { data: pushTokenData, error: tokenError } = await supabase
    .from('push_tokens')
    .select('token, platform')
    .eq('user_id', user_id)
    .single();

  if (tokenError || !pushTokenData) {
    return new Response(JSON.stringify({ error: 'Push token not found' }), { status: 404 });
  }

  const expoPushMessage = {
    to: pushTokenData.token,
    sound: 'default',
    title: 'FlowDay',
    body: getMessageForType(type, data),
    data: { type, ...data },
  };

  const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expoPushMessage),
  });
  const expoJson = await expoResponse.json();

  return new Response(JSON.stringify({ sent: true, ticket_id: expoJson.data?.['ticket-id'] }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

function getMessageForType(type: string, data: any): string {
  switch (type) {
    case 'morning_briefing':
      return `Good morning! You have ${data.tasks_due} tasks due and ${data.habits_today} habits today.`;
    case 'evening_review':
      return 'It’s time to review your day. How did you do?';
    case 'deadline_alert':
      return `Heads up: "${data.task_title}" is due soon!`;
    case 'habit_reminder':
      return `Time for your habit: ${data.habit_title}`;
    case 'note_reminder':
      return `Reminder: ${data.note_content}`;
    default:
      return 'FlowDay notification';
  }
}
