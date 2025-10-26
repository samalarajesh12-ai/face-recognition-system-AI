
'use client';

import Image from 'next/image';
import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Patient } from '@/lib/types';
import { Download, LogOut, User, FileText, HeartPulse, Phone, MapPin, Droplet, Calendar, StickyNote, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';


interface PatientProfileProps {
  patient: Patient;
  onLogout: () => void;
  onUpdatePatient: (patient: Patient) => void;
}

export default function PatientProfile({ patient, onLogout, onUpdatePatient }: PatientProfileProps) {
  const { toast } = useToast();

  const handleContactInfoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedPatient = {
      ...patient,
      contactNumber: formData.get('contactNumber') as string,
      alternativeContact: formData.get('alternativeContact') as string,
      houseAddress: formData.get('houseAddress') as string,
    };
    onUpdatePatient(updatedPatient);
    toast({
      title: "Contact Info Updated",
      description: "Your contact details have been successfully updated.",
    });
  };
  
  const handleEmergencyContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedPatient = {
      ...patient,
      emergencyContactName: formData.get('emergencyContactName') as string,
      emergencyContactRelation: formData.get('emergencyContactRelation') as string,
      emergencyContactPhone: formData.get('emergencyContactPhone') as string,
    };
    onUpdatePatient(updatedPatient);
    toast({
      title: "Emergency Contact Updated",
      description: "Your emergency contact details have been successfully updated.",
    });
  };


  const downloadBillReceipt = (bill: Patient['billPayments'][0]) => {
    const doc = new jsPDF();
    
    doc.setFont('PT Sans', 'bold');
    doc.setFontSize(20);
    doc.text('RMM Hospital (ENT) - Payment Receipt', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Patient: ${patient.firstName} ${patient.lastName}`, 20, 40);
    doc.text(`Patient ID: ${patient.id}`, 20, 47);
    doc.text(`Bill Date: ${format(parseISO(bill.date), 'PPP')}`, 140, 40);
    doc.text(`Status: ${bill.status}`, 140, 47);

    doc.line(20, 55, 190, 55); // Separator line

    let y = 65;
    doc.setFont('PT Sans', 'bold');
    doc.setFontSize(14);
    doc.text('Billing Details', 20, y);
    y += 10;
    
    doc.setFont('PT Sans', 'normal');
    doc.setFontSize(12);

    autoTable(doc, {
        startY: y,
        head: [['Description', 'Details']],
        body: [
            ['Diagnosis', bill.disease],
            ['Payment Method', bill.paymentMethod || 'N/A'],
        ],
        theme: 'plain',
        styles: { cellPadding: 2 },
    });
    
    y = (doc as any).lastAutoTable.finalY;

    if(bill.tablets && bill.tablets.length > 0) {
        autoTable(doc, {
            startY: y + 5,
            head: [['Prescribed Tablets', 'Usage']],
            body: bill.tablets.map(t => [t.name, t.usage]),
            theme: 'striped',
            headStyles: { fillColor: [82, 39, 30] },
        });
        y = (doc as any).lastAutoTable.finalY;
    }

    y += 10;
    doc.setFont('PT Sans', 'bold');
    doc.setFontSize(16);
    doc.text(`Total Amount: ₹${bill.amount.toFixed(2)}`, 190, y, { align: 'right' });

    y += 20;
    if (patient.signatureBase64) {
        try {
            doc.addImage(patient.signatureBase64, 'JPEG', 150, y, 40, 20);
            doc.line(150, y + 22, 190, y+22);
            doc.setFontSize(10);
            doc.text('Patient Signature', 170, y + 26, { align: 'center' });
        } catch(e) {
            console.error("Error adding signature image to PDF:", e);
        }
    }
    
    doc.save(`Bill_${bill.date}_${patient.id}.pdf`);
  };

  const downloadProfilePDF = () => {
    const doc = new jsPDF();
    
    doc.setFont('PT Sans', 'bold');
    doc.setFontSize(22);
    doc.text('Patient Profile - RMM Hospital (ENT)', 105, 20, { align: 'center' });

    if (patient.faceImageBase64) {
      try {
        doc.addImage(patient.faceImageBase64, 'JPEG', 150, 30, 45, 45);
      } catch (e) {
        console.error("Error adding face image to PDF:", e);
      }
    }

    let y = 40;
    doc.setFont('PT Sans', 'bold');
    doc.setFontSize(16);
    doc.text('Personal Information', 20, y);
    y += 10;
    
    doc.setFont('PT Sans', 'normal');
    doc.setFontSize(12);
    doc.text(`Patient ID: ${patient.id}`, 20, y);
    y += 7;
    doc.text(`Name: ${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`, 20, y);
    y += 7;
    doc.text(`Age: ${patient.age}, Gender: ${patient.gender}`, 20, y);
    y += 7;
    doc.text(`Blood Group: ${patient.bloodGroup}`, 20, y);
    y += 7;
    doc.text(`Contact: ${patient.contactNumber}`, 20, y);
    if(patient.alternativeContact) {
        y += 7;
        doc.text(`Alt. Contact: ${patient.alternativeContact}`, 20, y);
    }
    y += 7;
    doc.text(`Address: ${patient.houseAddress}`, 20, y);
    
    y += 15;
    doc.setFont('PT Sans', 'bold');
    doc.setFontSize(16);
    doc.text('Emergency Contact', 20, y);
    y += 10;

    doc.setFont('PT Sans', 'normal');
    doc.setFontSize(12);
    doc.text(`${patient.emergencyContactName} (${patient.emergencyContactRelation})`, 20, y);
    y += 7;
    doc.text(`Phone: ${patient.emergencyContactPhone}`, 20, y);

    y += 10;
    if (patient.diseases && patient.diseases.length > 0) {
      autoTable(doc, {
          startY: y,
          head: [['Medical History', 'Status']],
          body: patient.diseases.map(d => [d.name, d.status]),
          theme: 'grid',
          headStyles: { fillColor: [82, 39, 30] },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }
    
    if (patient.billPayments && patient.billPayments.length > 0) {
      autoTable(doc, {
          startY: y,
          head: [['Bill Date', 'Amount (₹)', 'Diagnosis', 'Payment Method', 'Status']],
          body: patient.billPayments.map(b => [format(parseISO(b.date), 'PPP'), `₹${b.amount.toFixed(2)}`, b.disease, b.paymentMethod, b.status]),
          theme: 'grid',
          headStyles: { fillColor: [82, 39, 30] },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }


    if (patient.signatureBase64) {
        try {
            doc.addImage(patient.signatureBase64, 'JPEG', 150, y, 50, 30);
            doc.setFontSize(10);
            doc.text('Signature', 175, y + 35, { align: 'center' });
        } catch(e) {
            console.error("Error adding signature image to PDF:", e);
        }
    }

    doc.save(`${patient.firstName}_Patient_Profile.pdf`);
  };


  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg animate-in fade-in duration-500">
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <User className="text-primary"/> Patient Profile
          </CardTitle>
          <CardDescription>
            {`${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`}
          </CardDescription>
        </div>
        <Image
          src={patient.faceImageBase64}
          alt="Patient Face"
          width={96}
          height={96}
          className="rounded-full border-4 border-primary/50 object-cover"
          data-ai-hint="person portrait"
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                 <h3 className="font-semibold text-lg flex items-center gap-2"><FileText className="text-accent" /> Details</h3>
                 <Dialog>
                    <DialogTrigger asChild>
                         <Button variant="outline" size="sm"><Pencil className="h-3 w-3 mr-2" /> Edit</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Contact Information</DialogTitle>
                            <DialogDescription>Update your contact number and address here.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => { handleContactInfoSubmit(e); (e.target as any).closest('div[role="dialog"]').querySelector('button[aria-label="Close"]').click(); }}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="contactNumber" className="text-right">Contact No.</Label>
                                    <Input id="contactNumber" name="contactNumber" defaultValue={patient.contactNumber} className="col-span-3" />
                                </div>
                                 <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="alternativeContact" className="text-right">Alt. Contact</Label>
                                    <Input id="alternativeContact" name="alternativeContact" defaultValue={patient.alternativeContact} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="houseAddress" className="text-right">Address</Label>
                                    <Input id="houseAddress" name="houseAddress" defaultValue={patient.houseAddress} className="col-span-3" />
                                </div>
                            </div>
                             <DialogFooter>
                                 <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                                 <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p className="flex items-center gap-2"><User size={16}/> <strong>Patient ID:</strong></p><p>{patient.id}</p>
                <p className="flex items-center gap-2"><Calendar size={16}/> <strong>Age:</strong></p><p>{patient.age}</p>
                <p className="flex items-center gap-2"><HeartPulse size={16}/> <strong>Gender:</strong></p><p>{patient.gender}</p>
                <p className="flex items-center gap-2"><Droplet size={16}/> <strong>Blood Group:</strong></p><p>{patient.bloodGroup}</p>
                <p className="flex items-center gap-2"><Phone size={16}/> <strong>Contact:</strong></p><p>{patient.contactNumber}</p>
                {patient.alternativeContact && <>
                    <p className="flex items-center gap-2"><Phone size={16}/> <strong>Alt. Contact:</strong></p><p>{patient.alternativeContact}</p>
                </>}
                 <p className="flex items-center gap-2 col-span-2"><MapPin size={16}/> <strong>Address:</strong> {patient.houseAddress}</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2"><HeartPulse className="text-accent"/> Medical Info</h3>
             <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p className="font-semibold">Allergies:</p><p>{patient.allergies?.join(", ") || "None"}</p>
                <p className="font-semibold">Last Visit:</p><p>{patient.lastVisit ? format(parseISO(patient.lastVisit), 'PPP') : 'N/A'}</p>
             </div>
             <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Phone className="text-accent"/> Emergency Contact</h3>
                 <Dialog>
                    <DialogTrigger asChild>
                         <Button variant="outline" size="sm"><Pencil className="h-3 w-3 mr-2" /> Edit</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Emergency Contact</DialogTitle>
                            <DialogDescription>Update the emergency contact details here.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => { handleEmergencyContactSubmit(e); (e.target as any).closest('div[role="dialog"]').querySelector('button[aria-label="Close"]').click(); }}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="emergencyContactName" className="text-right">Name</Label>
                                    <Input id="emergencyContactName" name="emergencyContactName" defaultValue={patient.emergencyContactName} className="col-span-3" />
                                </div>
                                 <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="emergencyContactRelation" className="text-right">Relation</Label>
                                    <Input id="emergencyContactRelation" name="emergencyContactRelation" defaultValue={patient.emergencyContactRelation} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="emergencyContactPhone" className="text-right">Phone</Label>
                                    <Input id="emergencyContactPhone" name="emergencyContactPhone" defaultValue={patient.emergencyContactPhone} className="col-span-3" />
                                </div>
                            </div>
                             <DialogFooter>
                                 <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                                 <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
             <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                 <p className="font-semibold">Name:</p><p>{patient.emergencyContactName}</p>
                 <p className="font-semibold">Relation:</p><p>{patient.emergencyContactRelation}</p>
                 <p className="font-semibold">Phone:</p><p>{patient.emergencyContactPhone}</p>
             </div>
          </div>
        </div>
        
        <div className="space-y-2">
            <h3 className="font-semibold text-lg flex items-center gap-2"><StickyNote className="text-accent"/> Signature</h3>
            {patient.signatureBase64 ? (
                <Image
                    src={patient.signatureBase64}
                    alt="Patient Signature"
                    width={200}
                    height={100}
                    className="rounded-md border bg-white p-2 object-contain"
                    data-ai-hint="signature"
                />
            ) : <p className="text-sm text-muted-foreground">No signature on file.</p>}
        </div>
        
        <div>
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><FileText className="text-accent"/> Medical History</h3>
            <Table>
            <TableCaption>A list of recent diseases and their status.</TableCaption>
            <TableHeader>
                <TableRow>
                <TableHead>Disease</TableHead>
                <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {patient.diseases && patient.diseases.length > 0 ? patient.diseases.map((d, i) => (
                <TableRow key={i}>
                    <TableCell>{d.name}</TableCell>
                    <TableCell><Badge variant={d.status === "Cured" ? "default" : "secondary"}>{d.status || "Unknown"}</Badge></TableCell>
                </TableRow>
                )) : (
                <TableRow>
                    <TableCell colSpan={2} className="text-center">No disease history available.</TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>

        <div>
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><FileText className="text-accent"/> Bill Payments</h3>
            <Table>
            <TableCaption>A list of your recent bills.</TableCaption>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {patient.billPayments && patient.billPayments.length > 0 ? patient.billPayments.map((bill, i) => (
                <TableRow key={i}>
                    <TableCell>{format(parseISO(bill.date), 'PPP')}</TableCell>
                    <TableCell>{bill.disease}</TableCell>
                    <TableCell>₹{bill.amount.toFixed(2)}</TableCell>
                    <TableCell>{bill.paymentMethod}</TableCell>
                    <TableCell>
                    <Badge variant={bill.status === 'Paid' ? 'default' : 'destructive'}>{bill.status}</Badge>
                    </TableCell>
                     <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => downloadBillReceipt(bill)}>
                            <Download className="h-4 w-4"/>
                        </Button>
                     </TableCell>
                </TableRow>
                )) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">No billing information found.</TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={downloadProfilePDF}>
          <Download className="mr-2 h-4 w-4" />
          Download Profile PDF
        </Button>
      </CardFooter>
    </Card>
  );
}
