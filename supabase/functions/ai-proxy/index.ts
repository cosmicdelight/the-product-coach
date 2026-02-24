import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((m): m is ChatMessage => {
      if (!m || typeof m !== 'object') return false;
      const msg = m as Record<string, unknown>;
      return (
        (msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant') &&
        typeof msg.content === 'string'
      );
    })
    .map(m => ({ role: m.role, content: m.content }));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = getEnv('SUPABASE_URL');
    const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');
    const authHeader = req.headers.get('Authorization') ?? '';
    const openaiKey = getEnv('OPENAI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: 'unauthorized' }, 401);
    }

    const payload = (await req.json()) as Record<string, unknown>;
    const mode = payload.mode;

    let messages: ChatMessage[] = [];
    let maxTokens = 1200;

    if (mode === 'suggestion') {
      const systemPrompt = typeof payload.systemPrompt === 'string' ? payload.systemPrompt : '';
      const userPrompt = typeof payload.userPrompt === 'string' ? payload.userPrompt : '';
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];
      maxTokens = 1200;
    } else if (mode === 'chat') {
      messages = sanitizeMessages(payload.messages);
      maxTokens = 600;
    } else {
      return jsonResponse({ error: 'invalid_mode' }, 400);
    }

    if (messages.length === 0) {
      return jsonResponse({ error: 'empty_messages' }, 400);
    }

    const openaiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (!openaiResponse.ok) {
      const detail = await openaiResponse.text();
      return jsonResponse({ error: 'openai_error', detail }, 502);
    }

    const data = await openaiResponse.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      return jsonResponse({ error: 'invalid_openai_response' }, 502);
    }

    return jsonResponse({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: 'internal_error', message }, 500);
  }
});
