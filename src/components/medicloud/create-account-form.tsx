
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, type Dispatch, type SetStateAction } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Patient } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';


type Page = 'loginChoice' | 'login' | 'createAccount' | 'patientProfile' | 'faceLogin';

interface CreateAccountFormProps {
  onCreateAccount: (patient: Patient) => void;
  setPage: Dispatch<SetStateAction<Page>>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  houseAddress: z.string().min(1, 'Address is required'),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  age: z.string().min(1, 'Age is required').regex(/^\d+$/, 'Age must be a number'),
  gender: z.string().min(1, 'Gender is required'),
  contactNumber: z.string().min(10, 'Enter a valid contact number').regex(/^\d+$/, 'Contact number must be numeric'),
  alternativeContact: z.string().optional(),
  allergies: z.string().optional(),
  existingDiseases: z.string().optional(),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactRelation: z.string().min(1, 'Emergency contact relation is required'),
  emergencyContactPhone: z.string().min(10, 'Enter a valid emergency contact number'),
  faceImageFile: z
    .any()
    .refine((file) => file, 'Face image is required.')
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file?.type), '.jpg, .jpeg, .png and .webp files are accepted.'),
  signatureFile: z
    .any()
    .optional()
    .refine((file) => !file || (file && file.size <= MAX_FILE_SIZE), `Max file size is 5MB.`)
    .refine((file) => !file || (file && ACCEPTED_IMAGE_TYPES.includes(file.type)), '.jpg, .jpeg, .png and .webp files are accepted.'),
});

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
});

const generateRandomString = (length: number) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};


export default function CreateAccountForm({ onCreateAccount, setPage }: CreateAccountFormProps) {
  const { toast } = useToast();
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '', middleName: '', lastName: '', houseAddress: '', bloodGroup: '',
      age: '', gender: '', contactNumber: '', allergies: '', existingDiseases: '',
      emergencyContactName: '', emergencyContactRelation: '', emergencyContactPhone: '',
      alternativeContact: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'faceImageFile' | 'signatureFile') => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue(fieldName, file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (fieldName === 'faceImageFile') setFaceImagePreview(reader.result as string);
        else setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const faceBase64 = await toBase64(values.faceImageFile);
        const signatureBase64 = values.signatureFile ? await toBase64(values.signatureFile) : '';
        const patientId = `PAT${generateRandomString(5)}`;
        const password = generateRandomString(8);

        const newPatient: Patient = {
            id: patientId,
            password: password,
            firstName: values.firstName,
            lastName: values.lastName,
            middleName: values.middleName,
            houseAddress: values.houseAddress,
            bloodGroup: values.bloodGroup,
            age: values.age,
            gender: values.gender,
            contactNumber: values.contactNumber,
            alternativeContact: values.alternativeContact,
            allergies: values.allergies?.split(',').map(s => s.trim()).filter(Boolean) || [],
            diseases: values.existingDiseases?.split(',').map(s => ({ name: s.trim(), status: 'Ongoing' })).filter(d => d.name) || [],
            emergencyContactName: values.emergencyContactName,
            emergencyContactRelation: values.emergencyContactRelation,
            emergencyContactPhone: values.emergencyContactPhone,
            faceImageBase64: faceBase64,
            signatureBase64: signatureBase64,
            billPayments: [],
            lastVisit: new Date().toISOString(),
            previousTreatments: [],
            notes: '',
        };

        onCreateAccount(newPatient);

        toast({
            title: 'Account Created Successfully!',
            description: (
              <div>
                <p>Your account has been created.</p>
                <p className="font-semibold">Patient ID: {patientId}</p>
                <p className="font-semibold">Password: {password}</p>
                <p className="text-xs mt-2">Please save these credentials securely.</p>
              </div>
            ),
            duration: 9000,
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'An error occurred.',
            description: 'Could not create account. Please try again.',
        });
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => setPage('loginChoice')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle className="text-center text-2xl font-headline">Create New Patient Account</CardTitle>
        <CardDescription className="text-center">Fill in the details below to register.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="middleName" render={({ field }) => (
                <FormItem><FormLabel>Middle Name (Optional)</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem><FormLabel>Age</FormLabel><FormControl><Input placeholder="30" type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem><FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
            
            <FormField control={form.control} name="houseAddress" render={({ field }) => (
              <FormItem><FormLabel>House Address</FormLabel><FormControl><Input placeholder="123 Main St, Anytown" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid md:grid-cols-2 gap-4">
             
              <FormField control={form.control} name="bloodGroup" render={({ field }) => (
                <FormItem><FormLabel>Blood Group</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
               <FormField control={form.control} name="contactNumber" render={({ field }) => (
                    <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="alternativeContact" render={({ field }) => (
                    <FormItem><FormLabel>Alternative Contact (Optional)</FormLabel><FormControl><Input placeholder="9876543211" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="allergies" render={({ field }) => (
                    <FormItem><FormLabel>Allergies (comma-separated)</FormLabel><FormControl><Input placeholder="Pollen, Dust" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

             <div className="grid md:grid-cols-1 gap-4">
                <FormField control={form.control} name="existingDiseases" render={({ field }) => (
                    <FormItem><FormLabel>Existing Diseases (comma-separated)</FormLabel><FormControl><Input placeholder="Hypertension" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

             <p className="text-sm font-medium text-foreground pt-2">Emergency Contact</p>
             <div className="grid md:grid-cols-3 gap-4">
              <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="emergencyContactRelation" render={({ field }) => (
                <FormItem><FormLabel>Relation</FormLabel><FormControl><Input placeholder="Spouse" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="9876543212" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-2">
                <FormField control={form.control} name="faceImageFile" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Face Image Upload</FormLabel>
                        <FormControl><Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'faceImageFile')} /></FormControl>
                        {faceImagePreview && <Image src={faceImagePreview} alt="Face Preview" width={180} height={180} className="mt-2 rounded-lg border object-contain aspect-square" />}
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="signatureFile" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Signature Upload (Optional)</FormLabel>
                        <FormControl><Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'signatureFile')} /></FormControl>
                        {signaturePreview && <Image src={signaturePreview} alt="Signature Preview" width={180} height={180} className="mt-2 rounded-lg border object-contain aspect-square bg-white p-2" />}
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
