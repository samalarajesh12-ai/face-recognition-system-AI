export interface Patient {
  id: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  houseAddress: string;
  bloodGroup: string;
  age: string;
  gender: string;
  contactNumber: string;
  alternativeContact?: string;
  allergies: string[];
  diseases: { name: string; status: string }[];
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  faceImageBase64: string;
  signatureBase64: string;
  billPayments: { 
    date: string; 
    amount: number; 
    status: 'Paid' | 'Pending';
    disease: string;
    tablets: { name: string; usage: string }[];
    paymentMethod: 'UPI' | 'Debit Card' | 'Insurance Claim' | 'Cash';
  }[];
  lastVisit: string | null;
  previousTreatments: any[];
  notes: string;
}
