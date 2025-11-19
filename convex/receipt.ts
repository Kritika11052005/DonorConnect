// convex/receipts.ts
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";
import { mutation, action, internalMutation, internalAction, internalQuery,query } from "./_generated/server";
// Generate receipt for donation
export const generateReceipt = action({
  args: {
    donationId: v.id("donations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<string> => {
  // Get donation details directly
  const donation = await ctx.runQuery(internal.receipt.getDonationDetails, {
    donationId: args.donationId,
  });

  if (!donation) {
    throw new Error("Donation not found");
  }

  // Generate receipt number
  const receiptNumber = `DCR-${Date.now()}-${args.donationId.slice(-6)}`;

  // Create receipt record directly
  const receiptId = await ctx.runMutation(internal.receipt.createReceipt, {
    userId: args.userId,
    donationId: args.donationId,
    receiptNumber,
    amount: donation.amount || 0,
    currency: "INR",
    donationType: donation.donationType,
    targetName: donation.targetName,
  });

  // Send email
  await ctx.runAction(internal.receipt.sendReceiptEmail, {
    receiptId,
    userEmail: donation.userEmail,
    userName: donation.userName,
    receiptNumber,
    amount: donation.amount || 0,
    targetName: donation.targetName,
    donationDate: donation.donationDate,
  });

  return receiptId;
},
});

// Get donation details for receipt
export const getDonationDetails = internalQuery({
  args: {
    donationId: v.id("donations"),
  },
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    if (!donation) return null;

    const donor = await ctx.db.get(donation.donorId);
    if (!donor) return null;

    const user = await ctx.db.get(donor.userId);
    if (!user) return null;

    let targetName = "";
    
    if (donation.ngoId) {
      const ngo = await ctx.db.get(donation.ngoId);
      targetName = ngo?.organizationName || "NGO";
    } else if (donation.campaignId) {
      const campaign = await ctx.db.get(donation.campaignId);
      targetName = campaign?.title || "Campaign";
    }

    return {
      ...donation,
      userName: user.name,
      userEmail: user.email,
      targetName,
    };
  },
});

// Create receipt record
export const createReceipt = internalMutation({
  args: {
    userId: v.id("users"),
    donationId: v.id("donations"),
    receiptNumber: v.string(),
    amount: v.number(),
    currency: v.string(),
    donationType: v.string(),
    targetName: v.string(),
  },
  handler: async (ctx, args) => {
    const receiptId = await ctx.db.insert("donationReceipts", {
      userId: args.userId,
      donationId: args.donationId,
      receiptNumber: args.receiptNumber,
      amount: args.amount,
      currency: args.currency,
      donationType: args.donationType,
      targetName: args.targetName,
      emailSent: false,
      generatedAt: Date.now(),
    });

    // Update donation with receipt ID
    await ctx.db.patch(args.donationId, {
      receiptId: receiptId,
      taxReceiptGenerated: true,
    });

    return receiptId;
  },
});

// Send receipt email
export const sendReceiptEmail = internalAction({
  args: {
    receiptId: v.id("donationReceipts"),
    userEmail: v.string(),
    userName: v.string(),
    receiptNumber: v.string(),
    amount: v.number(),
    targetName: v.string(),
    donationDate: v.number(),
  },
  handler: async (ctx, args) => {
    // In production, integrate with email service (SendGrid, Resend, etc.)
    // For now, we'll just log and mark as sent
    
    const emailHTML = generateReceiptEmailHTML({
      userName: args.userName,
      receiptNumber: args.receiptNumber,
      amount: args.amount,
      targetName: args.targetName,
      donationDate: new Date(args.donationDate).toLocaleDateString('en-IN'),
    });

    // TODO: Send actual email using your email service
    // Example with Resend:
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'DonorConnect <receipts@donorconnect.com>',
    //     to: args.userEmail,
    //     subject: `Donation Receipt - ${args.receiptNumber}`,
    //     html: emailHTML,
    //   }),
    // });

    console.log('Email sent to:', args.userEmail);
    console.log('Receipt HTML:', emailHTML);

    // Mark email as sent
    await ctx.runMutation(internal.receipt.markEmailSent, {
  receiptId: args.receiptId,
});

    return true;
  },
});

// Mark email as sent
export const markEmailSent = internalMutation({
  args: {
    receiptId: v.id("donationReceipts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.receiptId, {
      emailSent: true,
      emailSentAt: Date.now(),
    });
  },
});

// Helper function to generate email HTML
function generateReceiptEmailHTML(data: {
  userName: string;
  receiptNumber: string;
  amount: number;
  targetName: string;
  donationDate: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
        .receipt-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .amount { font-size: 24px; font-weight: bold; color: #f43f5e; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Thank You for Your Donation!</h1>
        </div>
        
        <div class="content">
          <p>Dear ${data.userName},</p>
          
          <p>Thank you for your generous donation to <strong>${data.targetName}</strong>. Your contribution makes a real difference in the lives of those we serve.</p>
          
          <div class="receipt-box">
            <h3 style="margin-top: 0;">Donation Receipt</h3>
            
            <div class="receipt-row">
              <span>Receipt Number:</span>
              <strong>${data.receiptNumber}</strong>
            </div>
            
            <div class="receipt-row">
              <span>Donation Amount:</span>
              <span class="amount">₹${data.amount.toLocaleString('en-IN')}</span>
            </div>
            
            <div class="receipt-row">
              <span>Date:</span>
              <strong>${data.donationDate}</strong>
            </div>
            
            <div class="receipt-row" style="border: none;">
              <span>Organization:</span>
              <strong>${data.targetName}</strong>
            </div>
          </div>
          
          <p><strong>Tax Information:</strong><br>
          This receipt may be used for tax deduction purposes under Section 80G of the Income Tax Act. Please consult with your tax advisor for specific guidance.</p>
          
          <p>Your donation will be used to support our ongoing programs and initiatives. We are committed to transparency and ensuring that your contribution makes the maximum possible impact.</p>
          
          <p style="margin-top: 30px;">With gratitude,<br><strong>The DonorConnect Team</strong></p>
        </div>
        
        <div class="footer">
          <p>DonorConnect - Connecting Hearts, Changing Lives</p>
          <p>If you have any questions about this receipt, please contact us.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
// convex/receipts.ts (add this query)

export const getReceiptById = query({
  args: {
    receiptId: v.id("donationReceipts"),
  },
  handler: async (ctx, args) => {
    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt) return null;

    const user = await ctx.db.get(receipt.userId);
    const donation = await ctx.db.get(receipt.donationId);

    return {
      ...receipt,
      userName: user?.name || 'Anonymous',
      userEmail: user?.email || '',
      donationDate: new Date(receipt.generatedAt).toLocaleDateString('en-IN'),
    };
  },
});