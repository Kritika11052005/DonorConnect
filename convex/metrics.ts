// convex/metrics.ts
import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Update hospital metrics when a blood donation is completed
 */
export const incrementHospitalBloodDonations = internalMutation({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, args) => {
    const hospital = await ctx.db.get(args.hospitalId);
    if (!hospital) return;

    await ctx.db.patch(args.hospitalId, {
      totalBloodDonations: (hospital.totalBloodDonations || 0) + 1,
    });

    // Trigger popularity recalculation
    await ctx.scheduler.runAfter(0, internal.popularityScores.updateHospitalPopularity, {
      hospitalId: args.hospitalId,
    });
  },
});

/**
 * Update hospital metrics when an organ transplant is completed
 */
export const incrementHospitalOrganTransplants = internalMutation({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, args) => {
    const hospital = await ctx.db.get(args.hospitalId);
    if (!hospital) return;

    await ctx.db.patch(args.hospitalId, {
      totalOrganTransplants: (hospital.totalOrganTransplants || 0) + 1,
    });

    await ctx.scheduler.runAfter(0, internal.popularityScores.updateHospitalPopularity, {
      hospitalId: args.hospitalId,
    });
  },
});

/**
 * Update NGO metrics when a donation is received
 */
export const incrementNGODonations = internalMutation({
  args: { 
    ngoId: v.id("ngos"),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const ngo = await ctx.db.get(args.ngoId);
    if (!ngo) return;

    await ctx.db.patch(args.ngoId, {
      totalDonationsReceived: (ngo.totalDonationsReceived || 0) + 1,
      totalAmountRaised: (ngo.totalAmountRaised || 0) + (args.amount || 0),
    });

    await ctx.scheduler.runAfter(0, internal.popularityScores.updateNGOPopularity, {
      ngoId: args.ngoId,
    });
  },
});

/**
 * Update NGO volunteer count
 */
export const updateNGOVolunteerCount = internalMutation({
  args: { ngoId: v.id("ngos") },
  handler: async (ctx, args) => {
    // Count active volunteers
    const activeVolunteers = await ctx.db
      .query("volunteers")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", args.ngoId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    await ctx.db.patch(args.ngoId, {
      totalVolunteers: activeVolunteers.length,
    });

    await ctx.scheduler.runAfter(0, internal.popularityScores.updateNGOPopularity, {
      ngoId: args.ngoId,
    });
  },
});

/**
 * Update campaign metrics when a donation is made
 */
export const incrementCampaignDonations = internalMutation({
  args: { 
    campaignId: v.id("fundraisingCampaigns"),
    amount: v.number(),
    donorId: v.id("donors"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return;

    // Update raised amount
    await ctx.db.patch(args.campaignId, {
      raisedAmount: campaign.raisedAmount + args.amount,
    });

    // Count unique donors
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const uniqueDonors = new Set(donations.map((d) => d.donorId));
    
    await ctx.db.patch(args.campaignId, {
      totalDonors: uniqueDonors.size,
    });

    // Check if campaign reached target and update status
    if (campaign.raisedAmount + args.amount >= campaign.targetAmount) {
      await ctx.db.patch(args.campaignId, {
        status: "completed",
      });
    }

    // Update NGO totals
    const ngo = await ctx.db.get(campaign.ngoId);
    if (ngo) {
      await ctx.scheduler.runAfter(0, internal.metrics.incrementNGODonations, {
        ngoId: campaign.ngoId,
        amount: args.amount,
      });
    }

    await ctx.scheduler.runAfter(0, internal.popularityScores.updateCampaignPopularity, {
      campaignId: args.campaignId,
    });
  },
});

/**
 * Initialize metrics for newly created entities
 */
export const initializeHospitalMetrics = internalMutation({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.hospitalId, {
      averageRating: 0,
      totalRatings: 0,
      totalBloodDonations: 0,
      totalOrganTransplants: 0,
      popularityScore: 0,
    });
  },
});

export const initializeNGOMetrics = internalMutation({
  args: { ngoId: v.id("ngos") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ngoId, {
      averageRating: 0,
      totalRatings: 0,
      totalDonationsReceived: 0,
      totalAmountRaised: 0,
      totalVolunteers: 0,
      popularityScore: 0,
    });
  },
});

export const initializeCampaignMetrics = internalMutation({
  args: { campaignId: v.id("fundraisingCampaigns") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.campaignId, {
      averageRating: 0,
      totalRatings: 0,
      totalDonors: 0,
      popularityScore: 0,
    });
  },
});