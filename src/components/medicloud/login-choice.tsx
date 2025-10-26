
'use client';

import type { Dispatch, SetStateAction } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, LogIn, Camera } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

type Page = 'loginChoice' | 'login' | 'createAccount' | 'patientProfile' | 'faceLogin';

interface LoginChoiceProps {
  setPage: Dispatch<SetStateAction<Page>>;
}

const motivationalImages = [
  { src: 'https://placehold.co/600x400.png', alt: 'Doctor with a patient', hint: 'doctor patient' },
  { src: 'https://placehold.co/600x400.png', alt: 'Modern hospital reception', hint: 'hospital reception' },
  { src: 'https://placehold.co/600x400.png', alt: 'Nurse smiling', hint: 'nurse smiling' },
];


export default function LoginChoice({ setPage }: LoginChoiceProps) {
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center space-y-4">
        <Carousel className="w-full max-w-sm mx-auto" opts={{ loop: true }}>
          <CarouselContent>
            {motivationalImages.map((image, index) => (
              <CarouselItem key={index}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={600}
                  height={400}
                  className="rounded-lg object-cover aspect-video"
                  data-ai-hint={image.hint}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
        <CardTitle className="text-3xl font-headline">Welcome</CardTitle>
        <CardDescription>Please select an option to continue</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 p-6">
        <Button size="lg" onClick={() => setPage('login')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <LogIn className="mr-2 h-5 w-5" />
          Patient Login
        </Button>
         <Button size="lg" onClick={() => setPage('faceLogin')} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <Camera className="mr-2 h-5 w-5" />
          Login with Face
        </Button>
        <Button variant="secondary" size="lg" onClick={() => setPage('createAccount')} className="w-full">
          <UserPlus className="mr-2 h-5 w-5" />
          Create New Account
        </Button>
      </CardContent>
    </Card>
  );
}
