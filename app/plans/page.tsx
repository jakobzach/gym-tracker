'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  _DialogTrigger as DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Copy } from 'lucide-react';

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

export default function Plans() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

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
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedPlans: WorkoutPlan[] = data.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        exercises: plan.workout_plan_exercises.map((wpe: any) => ({
          id: wpe.exercises.id,
          name: wpe.exercises.name,
          type: wpe.exercises.type,
          sets: wpe.sets,
        })),
      }));

      setPlans(formattedPlans);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewPlan = () => {
    router.push('/create-plan');
  };

  const handleEditPlan = (plan: WorkoutPlan) => {
    router.push(`/edit-plan/${plan.id}`);
  };

  const handleCopyPlan = (plan: WorkoutPlan) => {
    setSelectedPlan(plan);
    setNewPlanName(`Copy of ${plan.name}`);
    setOpenDialog(true);
  };

  const handleCreateCopy = async () => {
    if (!selectedPlan) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create new plan
      const { data: newPlanData, error: newPlanError } = await supabase
        .from('workout_plans')
        .insert({ name: newPlanName, user_id: user.id })
        .select()
        .single();

      if (newPlanError) throw newPlanError;

      // Copy exercises to new plan
      const exercisesToInsert = selectedPlan.exercises.map(exercise => ({
        workout_plan_id: newPlanData.id,
        exercise_id: exercise.id,
        sets: exercise.sets,
      }));

      const { error: insertError } = await supabase
        .from('workout_plan_exercises')
        .insert(exercisesToInsert);

      if (insertError) throw insertError;

      setOpenDialog(false);
      fetchPlans();
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Workout Plans</h1>
        <Button onClick={handleCreateNewPlan} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Create New Plan
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {plans.map(plan => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">{plan.exercises.length} exercises</p>
              {plan.exercises.map((exercise, index) => (
                <p key={index} className="text-sm">
                  {exercise.name} ({exercise.type}): {exercise.sets} sets
                </p>
              ))}
              <div className="flex justify-end mt-4 space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEditPlan(plan)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleCopyPlan(plan)}>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a copy of the plan</DialogTitle>
            <DialogDescription>Enter a name for the new plan</DialogDescription>
          </DialogHeader>
          <Input
            value={newPlanName}
            onChange={e => setNewPlanName(e.target.value)}
            placeholder="New plan name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCopy}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
