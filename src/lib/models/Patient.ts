import mongoose, { Schema, Document } from 'mongoose';

const DiseaseSchema = new Schema({
  name: { type: String, required: true },
  status: { type: String, required: true }
}, { _id: false });

const TabletSchema = new Schema({
  name: { type: String, required: true },
  usage: { type: String, required: true }
}, { _id: false });

const BillPaymentSchema = new Schema({
  date: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending'], required: true },
  disease: { type: String, required: true },
  tablets: [TabletSchema],
  paymentMethod: { 
    type: String, 
    enum: ['UPI', 'Debit Card', 'Insurance Claim', 'Cash'], 
    required: true 
  }
}, { _id: false });

const PatientSchema = new Schema({
  id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  houseAddress: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  age: { type: String, required: true },
  gender: { type: String, required: true },
  contactNumber: { type: String, required: true },
  alternativeContact: { type: String },
  allergies: [{ type: String }],
  diseases: [DiseaseSchema],
  emergencyContactName: { type: String, required: true },
  emergencyContactRelation: { type: String, required: true },
  emergencyContactPhone: { type: String, required: true },
  faceImageBase64: { type: String, required: true },
  signatureBase64: { type: String, default: '' },
  billPayments: [BillPaymentSchema],
  lastVisit: { type: String },
  previousTreatments: [{ type: Schema.Types.Mixed }],
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

export const PatientModel = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);

export interface IPatient extends Document {
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
  createdAt?: Date;
  updatedAt?: Date;
}
