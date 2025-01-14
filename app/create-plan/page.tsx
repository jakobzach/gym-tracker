'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { supabase } from '../../lib/supabase';
import { Trash2 } from 'lucide-react';

interface Exercise {
  name: string;
  type: 'Dumbbell' | 'Barbell' | 'Kettlebell' | 'Machine' | 'Bodyweight' | 'Cable';
  sets: number;
}

export default function CreatePlan() {
  const [planName, setPlanName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseType, setExerciseType] = useState<Exercise['type']>('Dumbbell');
  const [sets, setSets] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const addExercise = () => {
    if (exerciseName && exerciseType && sets) {
      setExercises([...exercises, { name: exerciseName, type: exerciseType, sets: parseInt(sets) }]);
      setExerciseName('');
      setSets('');
    }
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const savePlan = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // First, create the workout plan
      const { data: planData, error: planError } = await supabase
        .from('workout_plans')
        .insert({ name: planName, user_id: userData.user?.id })
        .select()
        .single();

      if (planError) throw planError;

      // Then, insert exercises and link them to the workout plan
      for (const exercise of exercises) {
        // Check if the exercise already exists
        let { data: existingExercise, error: exerciseError } = await supabase
          .from('exercises')
          .select('id')
          .eq('name', exercise.name)
          .eq('type', exercise.type)
          .eq('user_id', userData.user?.id)
          .single();

        if (exerciseError && exerciseError.code !== 'PGRST116') {
          throw exerciseError;
        }

        let exerciseId;

        if (!existingExercise) {
          // If the exercise doesn't exist, create it
          const { data: newExercise, error: newExerciseError } = await supabase
            .from('exercises')
            .insert({ name: exercise.name, type: exercise.type, user_id: userData.user?.id })
            .select()
            .single();

          if (newExerciseError) throw newExerciseError;
          exerciseId = newExercise.id;
        } else {
          exerciseId = existingExercise.id;
        }

        // Link the exercise to the workout plan
        const { error: linkError } = await supabase
          .from('workout_plan_exercises')
          .insert({ workout_plan_id: planData.id, exercise_id: exerciseId, sets: exercise.sets });

        if (linkError) throw linkError;
      }

      router.push('/plans');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const isFormValid = planName.trim() !== '' && exercises.length > 0;

  return (
    <Layout showBackButton>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create Workout Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="planName" className="text-sm font-medium">Plan Name</label>
              <Input
                id="planName"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Enter plan name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="exerciseName" className="text-sm font-medium">Exercise Name</label>
              <Input
                id="exerciseName"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="Enter exercise name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="exerciseType" className="text-sm font-medium">Exercise Type</label>
              <Select value={exerciseType} onValueChange={(value: Exercise['type']) => setExerciseType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exercise type" />
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
            </div>
            <div className="space-y-2">
              <label htmlFor="sets" className="text-sm font-medium">Sets</label>
              <Input
                id="sets"
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                placeholder="Enter number of sets"
              />
            </div>
            <Button onClick={addExercise}>Add Exercise</Button>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Exercises</h3>
            {exercises.map((exercise, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-sm text-gray-500">{exercise.type} - {exercise.sets} sets</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeExercise(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button 
            onClick={savePlan} 
            className="w-full mt-6"
            disabled={!isFormValid}
          >
            Save Plan
          </Button>
        </CardContent>
      </Card>
    </Layout>
  );
}

