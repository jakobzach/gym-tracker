'use client';

import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from '../../lib/supabase';

interface WorkoutLog {
  id: string;
  date: string;
  plan_id: string;
  exercises: {
    name: string;
    sets: {
      weight: number;
      reps: number;
    }[];
  }[];
}

export default function Workouts() {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkoutLogs();
  }, []);

  const fetchWorkoutLogs = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userData.user?.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setWorkoutLogs(data as WorkoutLog[]);
    } catch (err: any) {
      console.error('Error fetching workout logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Workout Logs</h1>
      {workoutLogs.length === 0 ? (
        <p>No workout logs found. Start a workout to create a log!</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {workoutLogs.map((log) => (
            <Card key={log.id}>
              <CardHeader>
                <CardTitle>{new Date(log.date).toLocaleDateString()}</CardTitle>
              </CardHeader>
              <CardContent>
                {log.exercises.map((exercise, index) => (
                  <div key={index} className="mb-4">
                    <h3 className="font-semibold">{exercise.name}</h3>
                    {exercise.sets.map((set, setIndex) => (
                      <p key={setIndex} className="text-sm">
                        Set {setIndex + 1}: {set.weight}kg x {set.reps} reps
                      </p>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}

