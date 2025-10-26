'use server';

import connectDB from './mongodb';
import { PatientModel } from './models/Patient';
import { Patient } from './types';
import { format } from 'date-fns';

const addDefaultDataIfNeeded = (patients: Patient[]): Patient[] => {
  if (!Array.isArray(patients)) {
    return [];
  }
  return patients.map(patient => {
    if (typeof patient !== 'object' || patient === null) {
      return patient;
    }

    const hasDiseases = patient.diseases && patient.diseases.length > 0;
    const hasBills = patient.billPayments && patient.billPayments.length > 0;

    if (!hasDiseases) {
      patient.diseases = [
        { name: 'Common Cold', status: 'Cured' },
        { name: 'Asthma', status: 'Ongoing' },
      ];
    }

    if (!hasBills || (hasBills && typeof patient.billPayments[0].disease === 'undefined') || (hasBills && typeof patient.billPayments[0].paymentMethod === 'undefined')) {
      patient.billPayments = [
        {
          date: new Date(2023, 10, 15).toISOString(),
          amount: 1500,
          status: 'Paid',
          disease: 'Viral Fever',
          tablets: [
            { name: 'Paracetamol', usage: '1 tablet twice a day' },
            { name: 'Azithromycin', usage: '1 tablet once a day' }
          ],
          paymentMethod: 'UPI',
        },
        {
          date: new Date(2024, 0, 20).toISOString(),
          amount: 250,
          status: 'Paid',
          disease: 'Follow-up Consultation',
          tablets: [],
          paymentMethod: 'Cash',
        },
        {
          date: new Date(2024, 2, 5).toISOString(),
          amount: 800,
          status: 'Paid',
          disease: 'Allergic Rhinitis',
          tablets: [
            { name: 'Cetirizine', usage: '1 tablet at night' }
          ],
          paymentMethod: 'Debit Card',
        },
        {
          date: new Date(2024, 4, 1).toISOString(),
          amount: 1200,
          status: 'Pending',
          disease: 'Sinusitis',
          tablets: [
            { name: 'Amoxicillin', usage: '1 tablet three times a day' },
            { name: 'Ibuprofen', usage: 'As needed for pain' }
          ],
          paymentMethod: 'Insurance Claim',
        }
      ];
    }

    if (!patient.lastVisit) {
      patient.lastVisit = new Date().toISOString();
    }

    patient.allergies = patient.allergies || [];
    patient.previousTreatments = patient.previousTreatments || [];
    patient.notes = patient.notes || '';

    return patient;
  });
};

export async function getPatients(): Promise<Patient[]> {
  try {
    console.log('🔄 Fetching patients from MongoDB...');
    console.log('🔗 Attempting to connect to MongoDB...');

    await connectDB();
    console.log('✅ MongoDB connection successful');

    console.log('🔍 Querying PatientModel.find({})...');
    const patients = await PatientModel.find({}).lean();
    console.log(`📊 Raw MongoDB response:`, patients);
    console.log(`✅ Retrieved ${patients.length} patients from MongoDB`);

    if (patients.length === 0) {
      console.log('⚠️ No patients found in database - this might be normal for a new database');
    }

    // Convert MongoDB documents to Patient objects
    const patientObjects = patients.map(patient => ({
      id: patient.id,
      password: patient.password,
      firstName: patient.firstName,
      middleName: patient.middleName,
      lastName: patient.lastName,
      houseAddress: patient.houseAddress,
      bloodGroup: patient.bloodGroup,
      age: patient.age,
      gender: patient.gender,
      contactNumber: patient.contactNumber,
      alternativeContact: patient.alternativeContact,
      allergies: patient.allergies || [],
      diseases: patient.diseases || [],
      emergencyContactName: patient.emergencyContactName,
      emergencyContactRelation: patient.emergencyContactRelation,
      emergencyContactPhone: patient.emergencyContactPhone,
      faceImageBase64: patient.faceImageBase64,
      signatureBase64: patient.signatureBase64 || '',
      billPayments: patient.billPayments || [],
      lastVisit: patient.lastVisit,
      previousTreatments: patient.previousTreatments || [],
      notes: patient.notes || ''
    })) as Patient[];

    console.log(`🔄 Converting ${patientObjects.length} patients to Patient objects...`);
    const result = addDefaultDataIfNeeded(patientObjects);
    console.log(`✅ Final result: ${result.length} patients with default data`);

    return result;
  } catch (error) {
    console.error('❌ Error fetching patients from MongoDB:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw new Error('Could not read patient data.');
  }
}

export async function savePatients(patients: Patient[]): Promise<void> {
  try {
    console.log(`🔄 Saving ${patients.length} patients to MongoDB...`);
    await connectDB();
    await PatientModel.deleteMany({});
    if (patients.length > 0) {
      await PatientModel.insertMany(patients);
      console.log(`✅ Successfully saved ${patients.length} patients to MongoDB`);
    }
  } catch (error) {
    console.error('❌ Error saving patients to MongoDB:', error);
    throw new Error('Could not save patient data.');
  }
}
