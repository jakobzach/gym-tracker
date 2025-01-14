import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'gym-tracker-auth',
    storage: {
      getItem: (key) => {
        try {
          if (typeof window !== 'undefined') {
            return window.localStorage.getItem(key);
          }
        } catch (error) {
          console.warn('localStorage is not available:', error);
        }
        return null;
      },
      setItem: (key, value) => {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value);
          }
        } catch (error) {
          console.warn('localStorage is not available:', error);
        }
      },
      removeItem: (key) => {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key);
          }
        } catch (error) {
          console.warn('localStorage is not available:', error);
        }
      },
    }
  }
})

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error fetching session:', error)
    return null
  }
  return data.session
}

export const refreshSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error refreshing session:', error)
    return null
  }
  return data.session
}
