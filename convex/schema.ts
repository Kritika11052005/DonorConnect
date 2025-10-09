import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - all users (donors, hospitals, NGOs, admins)
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("donor"), v.literal("hospital"), v.literal("ngo"), v.literal("admin")),
    phoneNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    pincode: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Donors specific data
  donors: defineTable({
    userId: v.id("users"),
    bloodGroup: v.optional(v.union(
      v.literal("A+"), v.literal("A-"),
      v.literal("B+"), v.literal("B-"),
      v.literal("AB+"), v.literal("AB-"),
      v.literal("O+"), v.literal("O-")
    )),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.union(
      v.literal("male"),
      v.literal("female"),
      v.literal("other")
    )),
    isOrganDonor: v.boolean(),
    organDonorPledgeDate: v.optional(v.number()),
    availableForBloodDonation: v.boolean(),
    lastBloodDonationDate: v.optional(v.number()),
    nextEligibleBloodDonationDate: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_bloodGroup", ["bloodGroup"])
    .index("by_organDonor", ["isOrganDonor"])
    .index("by_gender", ["gender"]),

  // NGOs
  ngos: defineTable({
    userId: v.id("users"),
    organizationName: v.string(),
    registrationNumber: v.string(),
    logo: v.optional(v.string()), // URL to logo
    websiteUrl: v.optional(v.string()),
    description: v.string(),
    verified: v.boolean(),
    categories: v.array(v.string()), // ["education", "health", "environment", etc.]
    // NEW: Rating and popularity metrics
    averageRating: v.optional(v.number()), // 0-5 stars
    totalRatings: v.optional(v.number()), // Number of ratings received
    totalDonationsReceived: v.optional(v.number()), // Count of donations
    totalAmountRaised: v.optional(v.number()), // Total money raised
    totalVolunteers: v.optional(v.number()), // Number of volunteers
    popularityScore: v.optional(v.number()), // Calculated popularity metric
  })
    .index("by_userId", ["userId"])
    .index("by_verified", ["verified"])
    .index("by_popularityScore", ["popularityScore"])
    .index("by_averageRating", ["averageRating"]),

  // NGO Fundraising Campaigns
  fundraisingCampaigns: defineTable({
    ngoId: v.id("ngos"),
    title: v.string(),
    description: v.string(),
    targetAmount: v.number(),
    raisedAmount: v.number(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    category: v.string(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    createdAt: v.number(),
    // NEW: Rating and popularity
    averageRating: v.optional(v.number()),
    totalRatings: v.optional(v.number()),
    totalDonors: v.optional(v.number()), // Number of unique donors
    popularityScore: v.optional(v.number()),
  })
    .index("by_ngoId", ["ngoId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_popularityScore", ["popularityScore"]),

  // Volunteers
  volunteers: defineTable({
    donorId: v.id("donors"),
    ngoId: v.id("ngos"),
    startDate: v.number(),
    endDate: v.number(), // Auto-calculated as startDate + 3 months
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    role: v.optional(v.string()),
    hoursContributed: v.optional(v.number()),
  })
    .index("by_donorId", ["donorId"])
    .index("by_ngoId", ["ngoId"])
    .index("by_status", ["status"]),

  // Hospitals
  hospitals: defineTable({
    userId: v.id("users"),
    hospitalName: v.string(),
    description: v.string(),
    registrationNumber: v.string(),
    hospitalType: v.union(v.literal("government"), v.literal("private"), v.literal("trust")),
    totalBeds: v.optional(v.number()),
    verified: v.boolean(),
    specializations: v.array(v.string()),
    // NEW: Rating and popularity metrics
    averageRating: v.optional(v.number()), // 0-5 stars
    totalRatings: v.optional(v.number()),
    totalBloodDonations: v.optional(v.number()), // Count of blood donations
    totalOrganTransplants: v.optional(v.number()), // Count of organ transplants
    popularityScore: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_verified", ["verified"])
    .index("by_popularityScore", ["popularityScore"])
    .index("by_averageRating", ["averageRating"]),

  // Blood Donation Requests by Hospitals
  bloodDonationRequests: defineTable({
    hospitalId: v.id("hospitals"),
    bloodGroup: v.union(
      v.literal("A+"), v.literal("A-"),
      v.literal("B+"), v.literal("B-"),
      v.literal("AB+"), v.literal("AB-"),
      v.literal("O+"), v.literal("O-")
    ),
    unitsRequired: v.number(),
    urgency: v.union(v.literal("critical"), v.literal("urgent"), v.literal("normal")),
    requiredBy: v.number(),
    status: v.union(v.literal("open"), v.literal("fulfilled"), v.literal("cancelled")),
    createdAt: v.number(),
  })
    .index("by_hospitalId", ["hospitalId"])
    .index("by_bloodGroup", ["bloodGroup"])
    .index("by_status", ["status"]),

  // Blood Donation Appointments
  bloodDonationAppointments: defineTable({
    donorId: v.id("donors"),
    hospitalId: v.id("hospitals"),
    requestId: v.optional(v.id("bloodDonationRequests")),
    scheduledDate: v.number(),
    scheduledTime: v.string(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("missed"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_donorId", ["donorId"])
    .index("by_hospitalId", ["hospitalId"])
    .index("by_status", ["status"])
    .index("by_scheduledDate", ["scheduledDate"]),

  // Organ Donation Registry
  organDonationRegistry: defineTable({
    donorId: v.id("donors"),
    organs: v.array(v.string()), // ["heart", "kidney", "liver", "lungs", etc.]
    pledgeDate: v.number(),
    medicalHistory: v.optional(v.string()),
    emergencyContactName: v.string(),
    emergencyContactPhone: v.string(),
    status: v.union(v.literal("active"), v.literal("utilized"), v.literal("revoked")),
  })
    .index("by_donorId", ["donorId"])
    .index("by_status", ["status"]),

  // Organ Transplant Requests
  organTransplantRequests: defineTable({
  hospitalId: v.id("hospitals"),
  organType: v.string(),
  patientBloodGroup: v.union(
    v.literal("A+"), v.literal("A-"),
    v.literal("B+"), v.literal("B-"),
    v.literal("AB+"), v.literal("AB-"),
    v.literal("O+"), v.literal("O-")
  ),
  urgency: v.union(v.literal("critical"), v.literal("urgent"), v.literal("normal")),
  patientAge: v.number(),
  additionalDetails: v.optional(v.string()),
  targetHospitalId: v.optional(v.id("hospitals")), // NEW: Specific target hospital or broadcast to all
  status: v.union(v.literal("open"), v.literal("matched"), v.literal("completed"), v.literal("cancelled")),
  createdAt: v.number(),
})
  .index("by_hospitalId", ["hospitalId"])
  .index("by_organType", ["organType"])
  .index("by_status", ["status"])
  .index("by_targetHospitalId", ["targetHospitalId"]),

  // Hospital Organ Availability (Simplified tracking)
  // Add this to your schema.ts file - UPDATE for hospitalOrganAvailability table

hospitalOrganAvailability: defineTable({
  hospitalId: v.id("hospitals"),
  organType: v.string(),
  bloodGroup: v.union(
    v.literal("A+"), v.literal("A-"),
    v.literal("B+"), v.literal("B-"),
    v.literal("AB+"), v.literal("AB-"),
    v.literal("O+"), v.literal("O-")
  ),
  quantity: v.optional(v.number()), // NEW: Track quantity
  availableUntil: v.number(),
  donorAge: v.optional(v.number()),
  status: v.union(
    v.literal("available"), 
    v.literal("allocated"), 
    v.literal("transplanted"), 
    v.literal("expired")
  ),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()), // NEW: Track updates
})
  .index("by_hospitalId", ["hospitalId"])
  .index("by_organType", ["organType"])
  .index("by_status", ["status"])
  .index("by_bloodGroup", ["bloodGroup"]),

  // Donations (Money, Clothes, Books, etc.)
  donations: defineTable({
    donorId: v.id("donors"),
    ngoId: v.optional(v.id("ngos")),
    campaignId: v.optional(v.id("fundraisingCampaigns")),
    donationType: v.union(
      v.literal("money"),
      v.literal("clothes"),
      v.literal("books"),
      v.literal("food"),
      v.literal("medical_supplies")
    ),
    amount: v.optional(v.number()),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    description: v.optional(v.string()),
    donationDate: v.number(),
    pickupScheduled: v.optional(v.boolean()),
    pickupDate: v.optional(v.number()),
    pickupAddress: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    paymentId: v.optional(v.string()),
    taxReceiptGenerated: v.boolean(),
    taxReceiptUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_donorId", ["donorId"])
    .index("by_ngoId", ["ngoId"])
    .index("by_donationType", ["donationType"])
    .index("by_status", ["status"])
    .index("by_campaignId", ["campaignId"]),

  // Ratings for hospitals
  hospitalRatings: defineTable({
    hospitalId: v.id("hospitals"),
    userId: v.id("users"),
    rating: v.number(), // 1-5 stars
    review: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_hospitalId", ["hospitalId"])
    .index("by_userId", ["userId"]),

  // Ratings for NGOs
  ngoRatings: defineTable({
    ngoId: v.id("ngos"),
    userId: v.id("users"),
    rating: v.number(),
    review: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_ngoId", ["ngoId"])
    .index("by_userId", ["userId"]),

  // Ratings for campaigns
  campaignRatings: defineTable({
    campaignId: v.id("fundraisingCampaigns"),
    userId: v.id("users"),
    rating: v.number(),
    review: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_campaignId", ["campaignId"])
    .index("by_userId", ["userId"]),

  // Tax Receipts (80G Certificates)
  taxReceipts: defineTable({
    donationId: v.id("donations"),
    donorId: v.id("donors"),
    receiptNumber: v.string(),
    financialYear: v.string(),
    amount: v.number(),
    certificateUrl: v.string(),
    generatedAt: v.number(),
  })
    .index("by_donorId", ["donorId"])
    .index("by_donationId", ["donationId"])
    .index("by_financialYear", ["financialYear"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("blood_donation"),
      v.literal("organ_donation"),
      v.literal("volunteer"),
      v.literal("donation"),
      v.literal("system")
    ),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_read", ["read"]),
});