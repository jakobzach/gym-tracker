import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: Request) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const { _data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirmed: true,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Email confirmed successfully' });
  } catch (error) {
    console.error('Error confirming email:', error);
    return NextResponse.json({ error: 'Failed to confirm email' }, { status: 500 });
  }
}
