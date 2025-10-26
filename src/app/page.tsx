
'use client';

import { useState, useEffect } from 'react';
import type { Patient } from '@/lib/types';
import LoginChoice from '@/components/medicloud/login-choice';
import LoginForm from '@/components/medicloud/login-form';
import CreateAccountForm from '@/components/medicloud/create-account-form';
import PatientProfile from '@/components/medicloud/patient-profile';
import { AppLogo } from '@/components/medicloud/icons';
import FaceLoginForm from '@/components/medicloud/face-login-form';
import { getPatients, savePatients } from '@/lib/patient-data';

type Page = 'loginChoice' | 'login' | 'createAccount' | 'patientProfile' | 'faceLogin';

export default function Home() {
  const [page, setPage] = useState<Page>('loginChoice');
  const [patientsDB, setPatientsDB] = useState<Patient[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  console.log("Server GEMINI_API_KEY exists?", !!process.env.GEMINI_API_KEY);


  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const patients = await getPatients();
        setPatientsDB(patients);
      } catch (error) {
        console.error('Error fetching patients', error);
        setPatientsDB([]);
      }
      setIsInitialized(true);
    };
    fetchPatients();
  }, []);

  const updateAndSavePatients = (updater: (prev: Patient[]) => Patient[]) => {
    const updatedPatients = updater(patientsDB);
    setPatientsDB(updatedPatients);
    savePatients(updatedPatients).catch(error => {
      console.error('Error saving patients', error);
      // Optionally show a toast to the user
    });
  };


  const handleCreateAccount = (newPatient: Patient) => {
    updateAndSavePatients(prev => [...prev, newPatient]);
    setPage('loginChoice');
  };

  const handleLogin = (patient: Patient) => {
    const fullPatientData = patientsDB.find(p => p.id === patient.id) || patient;
    setCurrentPatient(fullPatientData);
    setPage('patientProfile');
  };

  const handleLogout = () => {
    setCurrentPatient(null);
    setPage('loginChoice');
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setCurrentPatient(updatedPatient);
    updateAndSavePatients(prevDB => prevDB.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };


  const renderPage = () => {
    if (!isInitialized) {
      return <div className="text-center">Loading Patient Data...</div>;
    }
    switch (page) {
      case 'login':
        return <LoginForm onLoginSuccess={handleLogin} setPage={setPage} />;
      case 'faceLogin':
        return <FaceLoginForm onLoginSuccess={handleLogin} setPage={setPage} />;
      case 'createAccount':
        return <CreateAccountForm onCreateAccount={handleCreateAccount} setPage={setPage} />;
      case 'patientProfile':
        return currentPatient && <PatientProfile patient={currentPatient} onLogout={handleLogout} onUpdatePatient={handleUpdatePatient} />;
      case 'loginChoice':
      default:
        return <LoginChoice setPage={setPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
      {page === 'loginChoice' && (
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AppLogo className="h-8 w-8 text-primary" />
            <h1 className="text-base font-bold font-headline text-primary">
              Patient Portal
            </h1>
          </div>
        </header>
      )}
      <main className="w-full max-w-4xl">
        {renderPage()}
      </main>
      {page === 'loginChoice' && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} RMM Hospital (ENT). All Rights Reserved.</p>
        </footer>
      )}
    </div>
  );
}
