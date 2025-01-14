'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { supabase } from '../../lib/supabase';

interface WorkoutPlan {
  id: string;
  name: string;
  exercises: { name: string; sets: number }[];
}

export default function StartWorkout() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchWorkoutPlans();
  }, []);

  const fetchWorkoutPlans = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', userData.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPlans(data as WorkoutPlan[]);
      // Set the most recent plan as selected
      if (data && data.length > 0) {
        setSelectedPlan(data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching workout plans:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (value: string) => {
    setSelectedPlan(value);
  };

  const startWorkout = () => {
    if (selectedPlan) {
      router.push(`/log-workout/${selectedPlan}`);
    }
  };

  if (loading) {
    return (
      <Layout showBackButton>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout showBackButton>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout showBackButton>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Start Workout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="plan-select" className="text-sm font-medium">
                Select Workout Plan
              </label>
              <Select value={selectedPlan} onValueChange={handlePlanChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a workout plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={startWorkout} disabled={!selectedPlan} className="w-full">
              Start Workout
            </Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
