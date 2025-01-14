'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { _Alert as Alert, _AlertDescription as AlertDescription } from '@/components/ui/alert';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          setUser({ ...user, first_name: data?.first_name });
        }
      } catch (error) {
        console.error('Error in getProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Welcome, {user.first_name || 'User'}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Workout Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/create-plan')} className="w-full">
              Create Plan
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Start Workout</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/start-workout')} className="w-full">
              Start Workout
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
