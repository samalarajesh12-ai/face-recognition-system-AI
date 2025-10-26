
'use client';

import { useState, useRef, useEffect, type Dispatch, type SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Patient } from '@/lib/types';
import { ArrowLeft, Camera, RefreshCw, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authenticatePatientWithFace } from '@/lib/auth';

type Page = 'loginChoice' | 'login' | 'createAccount' | 'patientProfile' | 'faceLogin';

interface FaceLoginFormProps {
  onLoginSuccess: (patient: Patient) => void;
  setPage: Dispatch<SetStateAction<Page>>;
}

const formSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient profile.'),
});

export default function FaceLoginForm({ onLoginSuccess, setPage }: FaceLoginFormProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
    },
  });

  // Fetch patients from database on component mount
  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoadingPatients(true);
      try {
        const { getAllPatients } = await import('@/lib/auth');
        const fetchedPatients = await getAllPatients();
        setPatients(fetchedPatients);
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast({
          variant: 'destructive',
          title: 'Database Error',
          description: 'Unable to load patient profiles. Please try again later.',
        });
      } finally {
        setIsLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [toast]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [toast]);

  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  };

  const handleVerify = async (values: z.infer<typeof formSchema>) => {
    if (isVerifying) return;

    const liveImage = captureFrame();
    if (!liveImage) {
      toast({ variant: 'destructive', title: 'Could not capture image.' });
      return;
    }

    setIsVerifying(true);
    toast({ title: 'Verifying face...', description: 'Please hold still.' });

    try {
      const result = await authenticatePatientWithFace(values.patientId, liveImage);

      if (result.success && result.patient) {
        toast({
          title: 'Login Successful!',
          description: `Welcome back, ${result.patient.firstName}! Confidence: ${result.confidence ? (result.confidence * 100).toFixed(2) + '%' : 'High'}`,
        });
        onLoginSuccess(result.patient);
      } else {
        toast({
          variant: 'destructive',
          title: 'Face Verification Failed',
          description: result.error || 'The faces do not match. Please try again.',
        });
      }
    } catch (error) {
      console.error('Face verification error:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred during verification.',
        description: 'Please try again later.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => setPage('loginChoice')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle className="text-center text-2xl font-headline">Face Login</CardTitle>
        <CardDescription className="text-center">Select your profile and look into the camera to log in.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleVerify)}>
          <CardContent className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
              {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <p className="text-white text-center p-4">Camera access is required. Please enable it in your browser settings.</p>
                </div>
              )}
            </div>

            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access to use this feature. You may need to refresh the page after granting permission.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Patient Profile</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingPatients || patients.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isLoadingPatients
                            ? "Loading profiles..."
                            : patients.length === 0
                              ? "No patient accounts exist"
                              : "Select your patient profile..."
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingPatients ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading profiles...
                          </div>
                        </SelectItem>
                      ) : patients.length > 0 ? (
                        patients.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.firstName} {p.lastName} ({p.id})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No patient accounts exist
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isVerifying || !hasCameraPermission || !form.watch('patientId') || isLoadingPatients}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Verify Face
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
