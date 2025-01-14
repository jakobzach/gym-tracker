'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { supabase } from '../../../lib/supabase';
import { Trash2, Plus } from 'lucide-react';

interface Exercise {
  id: number;
  name: string;
  type: 'Dumbbell' | 'Barbell' | 'Kettlebell' | 'Machine' | 'Bodyweight' | 'Cable';
  sets: number;
}

export default function EditPlan({ params }: { params: { id: string } }) {
  const [planName, setPlanName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseType, setNewExerciseType] = useState<Exercise['type']>('Dumbbell');
  const [newExerciseSets, setNewExerciseSets] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workout_plans')
        .select(
          `
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
        `
        )
        .eq('id', params.id)
        .single();

      if (error) throw error;

      setPlanName(data.name);
      setExercises(
        data.workout_plan_exercises.map((wpe: any) => ({
          id: wpe.exercises.id,
          name: wpe.exercises.name,
          type: wpe.exercises.type as Exercise['type'],
          sets: wpe.sets,
        }))
      );
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addExercise = () => {
    if (newExerciseName && newExerciseType && newExerciseSets) {
      setExercises([
        ...exercises,
        {
          id: Date.now(), // temporary id
          name: newExerciseName,
          type: newExerciseType,
          sets: parseInt(newExerciseSets),
        },
      ]);
      setNewExerciseName('');
      setNewExerciseType('Dumbbell');
      setNewExerciseSets('');
    }
  };

  const removeExercise = (id: number) => {
    setExercises(exercises.filter(exercise => exercise.id !== id));
  };

  const updateExercise = (id: number, field: keyof Exercise, value: string | number) => {
    setExercises(
      exercises.map(exercise => (exercise.id === id ? { ...exercise, [field]: value } : exercise))
    );
  };

  const savePlan = async () => {
    try {
      const { error } = await supabase
        .from('workout_plans')
        .update({ name: planName })
        .eq('id', params.id);

      if (error) throw error;

      // Remove existing exercises
      await supabase.from('workout_plan_exercises').delete().eq('workout_plan_id', params.id);

      // Add updated exercises
      for (const exercise of exercises) {
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercises')
          .upsert({ id: exercise.id, name: exercise.name, type: exercise.type })
          .select()
          .single();

        if (exerciseError) throw exerciseError;

        const { error: linkError } = await supabase.from('workout_plan_exercises').insert({
          workout_plan_id: params.id,
          exercise_id: exerciseData.id,
          sets: exercise.sets,
        });

        if (linkError) throw linkError;
      }

      setSuccess('Plan updated successfully');
      setTimeout(() => router.push('/plans'), 2000);
    } catch (error: any) {
      setError(error.message);
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

  return (
    <Layout showBackButton>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Edit Workout Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="default">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="planName" className="text-sm font-medium">
                Plan Name
              </label>
              <Input
                id="planName"
                value={planName}
                onChange={e => setPlanName(e.target.value)}
                placeholder="Enter plan name"
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Exercises</h3>
              {exercises.map(exercise => (
                <div key={exercise.id} className="flex items-center space-x-2">
                  <Input
                    value={exercise.name}
                    onChange={e => updateExercise(exercise.id, 'name', e.target.value)}
                    placeholder="Exercise name"
                  />
                  <Select
                    value={exercise.type}
                    onValueChange={(value: Exercise['type']) =>
                      updateExercise(exercise.id, 'type', value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dumbbell">Dumbbell</SelectItem>
                      <SelectItem value="Barbell">Barbell</SelectItem>
                      <SelectItem value="Kettlebell">Kettlebell</SelectItem>
                      <SelectItem value="Machine">Machine</SelectItem>
                      <SelectItem value="Bodyweight">Bodyweight</SelectItem>
                      <SelectItem value="Cable">Cable</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={exercise.sets}
                    onChange={e => updateExercise(exercise.id, 'sets', parseInt(e.target.value))}
                    placeholder="Sets"
                    className="w-20"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeExercise(exercise.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Add New Exercise</h3>
              <div className="flex items-center space-x-2">
                <Input
                  value={newExerciseName}
                  onChange={e => setNewExerciseName(e.target.value)}
                  placeholder="New exercise name"
                />
                <Select
                  value={newExerciseType}
                  onValueChange={(value: Exercise['type']) => setNewExerciseType(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dumbbell">Dumbbell</SelectItem>
                    <SelectItem value="Barbell">Barbell</SelectItem>
                    <SelectItem value="Kettlebell">Kettlebell</SelectItem>
                    <SelectItem value="Machine">Machine</SelectItem>
                    <SelectItem value="Bodyweight">Bodyweight</SelectItem>
                    <SelectItem value="Cable">Cable</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={newExerciseSets}
                  onChange={e => setNewExerciseSets(e.target.value)}
                  placeholder="Sets"
                  className="w-20"
                />
                <Button onClick={addExercise}>
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
            </div>
            <Button onClick={savePlan} className="w-full">
              Save Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
