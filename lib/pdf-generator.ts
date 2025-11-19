// lib/pdf-generator.ts
import jsPDF from 'jspdf';

export interface ReceiptData {
  receiptNumber: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  targetName: string;
  donationType: string;
  donationDate: string;
  transactionId?: string;
}

export function generateReceiptPDF(data: ReceiptData) {
  const doc = new jsPDF();
  
  // Set colors
  const primaryColor: [number, number, number] = [244, 63, 94]; // Rose-500
  const secondaryColor: [number, number, number] = [236, 72, 153]; // Pink-500
  const textColor: [number, number, number] = [31, 41, 55]; // Gray-800
  const lightGray: [number, number, number] = [243, 244, 246]; // Gray-100
  
  let yPosition = 20;

  // Header with gradient effect (simulated with rectangles)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 50, 'F');
  
  // Logo/Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('DonorConnect', 105, 25, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Donation Receipt', 105, 35, { align: 'center' });
  
  yPosition = 60;

  // Thank you message
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank You for Your Generosity!', 105, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Donor information section
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.roundedRect(15, yPosition, 180, 30, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  doc.text('Donor Name:', 20, yPosition + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(data.userName, 60, yPosition + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Email:', 20, yPosition + 20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.userEmail, 60, yPosition + 20);
  
  yPosition += 45;

  // Receipt Details Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Receipt Details', 20, yPosition);
  
  yPosition += 10;

  // Receipt details table
  const details = [
    { label: 'Receipt Number', value: data.receiptNumber },
    { label: 'Donation Amount', value: `₹${data.amount.toLocaleString('en-IN')}`, highlight: true },
    { label: 'Currency', value: data.currency },
    { label: 'Donation Type', value: data.donationType === 'one_time' ? 'One-time' : 'Monthly Recurring' },
    { label: 'Organization', value: data.targetName },
    { label: 'Date', value: data.donationDate },
  ];

  if (data.transactionId) {
    details.push({ label: 'Transaction ID', value: data.transactionId });
  }

  details.forEach((detail, index) => {
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(15, yPosition, 180, 12, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(detail.label + ':', 20, yPosition + 8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    if (detail.highlight) {
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(detail.value, 190, yPosition + 8, { align: 'right' });
      doc.setFontSize(10);
    } else {
      doc.text(detail.value, 190, yPosition + 8, { align: 'right' });
    }

    yPosition += 12;
  });

  yPosition += 10;

  // Tax information box
  doc.setFillColor(254, 252, 232); // Yellow-50
  doc.setDrawColor(250, 204, 21); // Yellow-400
  doc.roundedRect(15, yPosition, 180, 25, 3, 3, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(161, 98, 7); // Yellow-800
  doc.text('Tax Information:', 20, yPosition + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const taxText = 'This receipt may be used for tax deduction purposes under Section 80G of the Income Tax Act.';
  const splitTaxText = doc.splitTextToSize(taxText, 170);
  doc.text(splitTaxText, 20, yPosition + 15);
  
  yPosition += 35;

  // Impact message
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  const impactText = `Your generous contribution to ${data.targetName} will make a real difference. Thank you for choosing to create positive change in the world.`;
  const splitImpact = doc.splitTextToSize(impactText, 170);
  doc.text(splitImpact, 20, yPosition);
  
  yPosition += splitImpact.length * 5 + 15;

  // Footer
  doc.setDrawColor(229, 231, 235);
  doc.line(15, yPosition, 195, yPosition);
  
  yPosition += 10;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('DonorConnect - Connecting Hearts, Changing Lives', 105, yPosition, { align: 'center' });
  
  yPosition += 5;
  doc.text('For questions about this receipt, please contact support@donorconnect.com', 105, yPosition, { align: 'center' });
  
  yPosition += 5;
  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 105, yPosition, { align: 'center' });

  // Add watermark
  doc.setTextColor(220, 220, 220);
  doc.setFontSize(60);
  doc.setFont('helvetica', 'bold');
  doc.text('PAID', 105, 150, { align: 'center', angle: 45 });

  return doc;
}

export function downloadReceiptPDF(data: ReceiptData) {
  const doc = generateReceiptPDF(data);
  const fileName = `DonorConnect_Receipt_${data.receiptNumber}.pdf`;
  doc.save(fileName);
}