'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, ChevronRight } from 'lucide-react';
import Layout from '../../../components/Layout';
import { supabase } from '../../../lib/supabase';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Exercise {
  id: number;
  name: string;
  type: string;
  sets: number;
}

interface WorkoutPlan {
  id: number;
  name: string;
  exercises: Exercise[];
}

interface SetEntry {
  weight: string;
  reps: string;
}

export default function LogWorkout({ params }: { params: { planId: string } }) {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [logEntries, setLogEntries] = useState<{ [key: string]: SetEntry[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [setTimer, setSetTimer] = useState(0);
  const [isSetActive, setIsSetActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchWorkoutPlan();
  }, [params.planId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setWorkoutTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSetActive) {
      interval = setInterval(() => {
        setSetTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSetActive]);

  const fetchWorkoutPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select(`
        id,
        name,
        workout_plan_exercises (
          sets,
          exercises (
            id,
            name,
            type
          )
        )
      `)
        .eq('id', params.planId)
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from Supabase');
      }

      const formattedPlan: WorkoutPlan = {
        id: data.id,
        name: data.name,
        exercises: data.workout_plan_exercises.map((wpe: any) => ({
          id: wpe.exercises.id,
          name: wpe.exercises.name,
          type: wpe.exercises.type,
          sets: wpe.sets
        }))
      };

      setPlan(formattedPlan);
      initializeLogEntries(formattedPlan.exercises);
    } catch (err: any) {
      console.error('Error fetching workout plan:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const initializeLogEntries = (exercises: Exercise[]) => {
    const initialEntries: { [key: string]: SetEntry[] } = {};
    exercises.forEach((exercise) => {
      initialEntries[exercise.name] = Array(exercise.sets).fill({ weight: '', reps: '' });
    });
    setLogEntries(initialEntries);
  };

  const handleLogEntry = useCallback((exerciseName: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setLogEntries((prev) => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((set, index) =>
        index === setIndex ? { ...set, [field]: value } : set
      ),
    }));
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleWorkoutTimer = () => {
    setIsWorkoutActive((prev) => {
      if (!prev) {
        setStartTime(new Date());
      } else {
        setEndTime(new Date());
      }
      return !prev;
    });
  };

  const toggleSetTimer = () => {
    if (isSetActive) {
      // Stopping the set
      setIsSetActive(false);
      setSetTimer(0);
      if (currentSetIndex + 1 < (plan?.exercises[currentExerciseIndex]?.sets || 0)) {
        setCurrentSetIndex((prev) => prev + 1);
      } else if (currentExerciseIndex + 1 < (plan?.exercises.length || 0)) {
        setCurrentExerciseIndex((prev) => prev + 1);
        setCurrentSetIndex(0);
      }
    } else {
      // Starting the set
      setIsSetActive(true);
    }
  };

  const saveWorkoutLog = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!startTime) {
        throw new Error('Workout start time not set');
      }
      const endTimeToUse = endTime || new Date();

      const logData = {
        user_id: userData.user?.id,
        plan_id: params.planId,
        start_time: startTime.toISOString(),
        end_time: endTimeToUse.toISOString(),
        exercises: Object.entries(logEntries).map(([name, sets]) => ({
          name,
          sets: sets.map((set) => ({
            weight: parseFloat(set.weight) || 0,
            reps: parseInt(set.reps) || 0,
          })),
        })),
      };

      const { error } = await supabase.from('workout_logs').insert(logData);

      if (error) throw error;

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error saving workout log:', err);
      setError(err.message || 'An error occurred while saving the workout log');
    }
  };

  if (loading) {
    return (
      <Layout showBackButton>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout showBackButton>
        <div className="mt-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  if (!plan) {
    return (
      <Layout showBackButton>
        <Alert variant="destructive">
          <AlertDescription>Workout plan not found</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const progress = ((currentExerciseIndex * plan.exercises[0].sets + currentSetIndex) / (plan.exercises.length * plan.exercises[0].sets)) * 100;

  return (
    <Layout showBackButton>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">{plan.name}</h1>
        <Progress value={progress} className="w-full h-2" />
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Workout Time: {formatTime(workoutTimer)}</h2>
            <Button
              variant={isWorkoutActive ? "secondary" : "default"}
              onClick={toggleWorkoutTimer}
              className="rounded-full px-6"
            >
              {isWorkoutActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isWorkoutActive ? "Pause" : "Start"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {plan.exercises.map((exercise, exerciseIndex) => (
        <Card key={exercise.name} className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">{exercise.name}</h3>
            {Array.from({ length: exercise.sets }).map((_, setIndex) => (
              <div
                key={setIndex}
                className={`flex flex-col gap-4 mt-4 ${
                  exerciseIndex === currentExerciseIndex && setIndex <= currentSetIndex
                    ? 'opacity-100'
                    : 'opacity-50 pointer-events-none'
                }`}
              >
                <div className="flex gap-4 items-center">
                  <span className="min-w-[60px]">Set {setIndex + 1}</span>
                  <Input
                    type="number"
                    placeholder="Weight (kg)"
                    value={logEntries[exercise.name][setIndex].weight}
                    onChange={(e) => handleLogEntry(exercise.name, setIndex, 'weight', e.target.value)}
                    className="w-28"
                  />
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={logEntries[exercise.name][setIndex].reps}
                    onChange={(e) => handleLogEntry(exercise.name, setIndex, 'reps', e.target.value)}
                    className="w-28"
                  />
                </div>
                {exerciseIndex === currentExerciseIndex && setIndex === currentSetIndex && (
                  <Button
                    variant={isSetActive ? "secondary" : "default"}
                    onClick={toggleSetTimer}
                    className="self-start rounded-full"
                  >
                    {isSetActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {isSetActive ? formatTime(setTimer) : "Start Set"}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <Button
        variant="default"
        onClick={saveWorkoutLog}
        className="mt-6 rounded-full py-2 px-6"
        disabled={!startTime}
      >
        Finish Workout
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </Layout>
  );
}

