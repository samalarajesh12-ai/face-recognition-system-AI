'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Patient } from '@/lib/types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { authenticatePatient } from '@/lib/auth';

type Page = 'loginChoice' | 'login' | 'createAccount' | 'patientProfile' | 'faceLogin';

interface LoginFormProps {
  onLoginSuccess: (patient: Patient) => void;
  setPage: Dispatch<SetStateAction<Page>>;
}

const formSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginForm({ onLoginSuccess, setPage }: LoginFormProps) {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isValidating) return;

    setIsValidating(true);

    try {
      const result = await authenticatePatient(values.patientId, values.password);

      if (result.success && result.patient) {
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${result.patient.firstName}!`,
        });

        onLoginSuccess(result.patient);
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: result.error || 'Invalid Patient ID or Password.',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Error',
        description: 'An unexpected error occurred. Please try again later.',
      });
    } finally {
      setIsValidating(false);
    }
  }

  const handleCreateAccount = () => {
    setPage('createAccount');
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => setPage('loginChoice')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle className="text-center text-2xl font-headline">Patient Login</CardTitle>
        <CardDescription className="text-center">Enter your credentials to access your profile.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., PAT12345"
                      {...field}
                      disabled={isValidating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isValidating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Login'
              )}
            </Button>
            <Button
              variant="link"
              onClick={handleCreateAccount}
              disabled={isValidating}
            >
              Don't have an account? Create one
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
