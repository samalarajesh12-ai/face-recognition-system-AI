import { getPatients, savePatients } from './patient-data';
import type { Patient } from './types';

export interface LoginResult {
    success: boolean;
    patient?: Patient;
    error?: string;
}

export interface FaceLoginResult {
    success: boolean;
    patient?: Patient;
    error?: string;
    confidence?: number;
}

/**
 * Get all patients from database
 */
export async function getAllPatients(): Promise<Patient[]> {
    try {
        return await getPatients();
    } catch (error) {
        console.error('Error fetching all patients:', error);
        return [];
    }
}

/**
 * Authenticate a patient using Patient ID and password
 */
export async function authenticatePatient(patientId: string, password: string): Promise<LoginResult> {
    try {
        console.log('🔐 Starting authentication for Patient ID:', patientId);

        // Fetch patients from database
        const patients = await getPatients();
        console.log('📊 Retrieved patients from database:', patients.length);

        if (patients.length === 0) {
            console.log('⚠️ No patients found in database');
            return {
                success: false,
                error: 'No patient records found in database'
            };
        }

        // Find patient by ID (case-insensitive) and validate password
        const patient = patients.find(p =>
            p.id.toLowerCase() === patientId.toLowerCase() &&
            p.password === password
        );

        if (!patient) {
            console.log('❌ Patient not found or password incorrect');
            return {
                success: false,
                error: 'Invalid Patient ID or Password'
            };
        }

        console.log('✅ Patient authenticated successfully:', patient.firstName);

        // Update last visit timestamp
        const updatedPatient = {
            ...patient,
            lastVisit: new Date().toISOString()
        };

        // Save updated patient data back to database
        try {
            await savePatients(patients.map(p =>
                p.id === patient.id ? updatedPatient : p
            ));
            console.log('💾 Last visit timestamp updated');
        } catch (saveError) {
            console.warn('⚠️ Could not update last visit timestamp:', saveError);
            // Continue with login even if timestamp update fails
        }

        return {
            success: true,
            patient: updatedPatient
        };
    } catch (error) {
        console.error('❌ Authentication error:', error);
        return {
            success: false,
            error: 'Unable to connect to database. Please try again later.'
        };
    }
}

/**
 * Authenticate a patient using face verification
 */
export async function authenticatePatientWithFace(patientId: string, liveImageDataUri: string): Promise<FaceLoginResult> {
    try {
        // Fetch patients from database
        const patients = await getPatients();

        // Find patient by ID
        const patient = patients.find(p => p.id === patientId);

        if (!patient) {
            return {
                success: false,
                error: 'Patient profile not found'
            };
        }

        // Import face verification function
        const { verifyFace } = await import('@/ai/flows/verify-face-flow');

        // Verify face
        const result = await verifyFace({
            faceImage1DataUri: patient.faceImageBase64,
            faceImage2DataUri: liveImageDataUri,
        });

        if (result.isSamePerson) {
            // Update last visit timestamp
            const updatedPatient = {
                ...patient,
                lastVisit: new Date().toISOString()
            };

            // Save updated patient data back to database
            try {
                await savePatients(patients.map(p =>
                    p.id === patient.id ? updatedPatient : p
                ));
            } catch (saveError) {
                console.warn('Could not update last visit timestamp:', saveError);
                // Continue with login even if timestamp update fails
            }

            return {
                success: true,
                patient: updatedPatient,
                confidence: result.confidence
            };
        } else {
            return {
                success: false,
                error: result.reason || 'Face verification failed. The faces do not match.'
            };
        }
    } catch (error) {
        console.error('Face authentication error:', error);
        return {
            success: false,
            error: 'An error occurred during face verification. Please try again later.'
        };
    }
}

/**
 * Get patient by ID from database
 */
export async function getPatientById(patientId: string): Promise<Patient | null> {
    try {
        const patients = await getPatients();
        return patients.find(p => p.id === patientId) || null;
    } catch (error) {
        console.error('Error fetching patient:', error);
        return null;
    }
}

/**
 * Validate patient credentials without updating last visit
 */
export async function validatePatientCredentials(patientId: string, password: string): Promise<boolean> {
    try {
        const patients = await getPatients();
        return patients.some(p =>
            p.id.toLowerCase() === patientId.toLowerCase() &&
            p.password === password
        );
    } catch (error) {
        console.error('Validation error:', error);
        return false;
    }
} 