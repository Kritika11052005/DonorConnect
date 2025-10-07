// convex/popularityScores.ts
import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Calculate popularity score for hospitals based on:
 * - Average rating (weight: 30%)
 * - Total blood donations (weight: 40%)
 * - Total organ transplants (weight: 20%)
 * - Number of ratings (weight: 10%)
 */
export const updateHospitalPopularity = internalMutation({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, args) => {
    const hospital = await ctx.db.get(args.hospitalId);
    if (!hospital) return;

    const avgRating = hospital.averageRating || 0;
    const totalBloodDonations = hospital.totalBloodDonations || 0;
    const totalOrganTransplants = hospital.totalOrganTransplants || 0;
    const totalRatings = hospital.totalRatings || 0;

    const popularityScore =
      (avgRating / 5) * 30 +
      Math.min(totalBloodDonations / 10, 40) +
      Math.min(totalOrganTransplants * 4, 20) +
      Math.min(totalRatings / 5, 10);

    await ctx.db.patch(args.hospitalId, {
      popularityScore: Math.round(popularityScore * 10) / 10,
    });
  },
});

/**
 * Calculate popularity score for NGOs
 */
export const updateNGOPopularity = internalMutation({
  args: { ngoId: v.id("ngos") },
  handler: async (ctx, args) => {
    const ngo = await ctx.db.get(args.ngoId);
    if (!ngo) return;

    const avgRating = ngo.averageRating || 0;
    const totalDonations = ngo.totalDonationsReceived || 0;
    const totalAmount = ngo.totalAmountRaised || 0;
    const totalVolunteers = ngo.totalVolunteers || 0;
    const totalRatings = ngo.totalRatings || 0;

    const popularityScore =
      (avgRating / 5) * 25 +
      Math.min(totalDonations / 5, 30) +
      Math.min(totalAmount / 100000, 25) +
      Math.min(totalVolunteers / 2, 15) +
      Math.min(totalRatings / 10, 5);

    await ctx.db.patch(args.ngoId, {
      popularityScore: Math.round(popularityScore * 10) / 10,
    });
  },
});

/**
 * Calculate popularity score for campaigns
 */
export const updateCampaignPopularity = internalMutation({
  args: { campaignId: v.id("fundraisingCampaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return;

    const avgRating = campaign.averageRating || 0;
    const percentageReached = Math.min(
      (campaign.raisedAmount / campaign.targetAmount) * 100,
      100
    );
    const totalDonors = campaign.totalDonors || 0;
    const totalRatings = campaign.totalRatings || 0;

    const popularityScore =
      (avgRating / 5) * 30 +
      (percentageReached / 100) * 35 +
      Math.min(totalDonors / 2, 25) +
      Math.min(totalRatings / 5, 10);

    await ctx.db.patch(args.campaignId, {
      popularityScore: Math.round(popularityScore * 10) / 10,
    });
  },
});

/**
 * Add or update a rating for a hospital
 */
export const submitHospitalRating = mutation({
  args: {
    hospitalId: v.id("hospitals"),
    rating: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const existingRating = await ctx.db
      .query("hospitalRatings")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (existingRating) {
      await ctx.db.patch(existingRating._id, {
        rating: args.rating,
        review: args.review,
      });
    } else {
      await ctx.db.insert("hospitalRatings", {
        hospitalId: args.hospitalId,
        userId: user._id,
        rating: args.rating,
        review: args.review,
        createdAt: Date.now(),
      });
    }

    const allRatings = await ctx.db
      .query("hospitalRatings")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId))
      .collect();

    const avgRating =
      allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await ctx.db.patch(args.hospitalId, {
      averageRating: Math.round(avgRating * 10) / 10,
      totalRatings: allRatings.length,
    });

    await ctx.scheduler.runAfter(0, internal.popularityScores.updateHospitalPopularity, {
      hospitalId: args.hospitalId,
    });

    return { success: true, averageRating: avgRating };
  },
});

/**
 * Add or update a rating for an NGO
 */
export const submitNGORating = mutation({
  args: {
    ngoId: v.id("ngos"),
    rating: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const existingRating = await ctx.db
      .query("ngoRatings")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", args.ngoId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (existingRating) {
      await ctx.db.patch(existingRating._id, {
        rating: args.rating,
        review: args.review,
      });
    } else {
      await ctx.db.insert("ngoRatings", {
        ngoId: args.ngoId,
        userId: user._id,
        rating: args.rating,
        review: args.review,
        createdAt: Date.now(),
      });
    }

    const allRatings = await ctx.db
      .query("ngoRatings")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", args.ngoId))
      .collect();

    const avgRating =
      allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await ctx.db.patch(args.ngoId, {
      averageRating: Math.round(avgRating * 10) / 10,
      totalRatings: allRatings.length,
    });

    await ctx.scheduler.runAfter(0, internal.popularityScores.updateNGOPopularity, {
      ngoId: args.ngoId,
    });

    return { success: true, averageRating: avgRating };
  },
});

/**
 * Add or update a rating for a campaign
 */
export const submitCampaignRating = mutation({
  args: {
    campaignId: v.id("fundraisingCampaigns"),
    rating: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const existingRating = await ctx.db
      .query("campaignRatings")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (existingRating) {
      await ctx.db.patch(existingRating._id, {
        rating: args.rating,
        review: args.review,
      });
    } else {
      await ctx.db.insert("campaignRatings", {
        campaignId: args.campaignId,
        userId: user._id,
        rating: args.rating,
        review: args.review,
        createdAt: Date.now(),
      });
    }

    const allRatings = await ctx.db
      .query("campaignRatings")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const avgRating =
      allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await ctx.db.patch(args.campaignId, {
      averageRating: Math.round(avgRating * 10) / 10,
      totalRatings: allRatings.length,
    });

    await ctx.scheduler.runAfter(0, internal.popularityScores.updateCampaignPopularity, {
      campaignId: args.campaignId,
    });

    return { success: true, averageRating: avgRating };
  },
});

/**
 * Get ratings for a hospital
 */
export const getHospitalRatings = mutation({
  args: {
    hospitalId: v.id("hospitals"),
  },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("hospitalRatings")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId))
      .collect();

    const ratingsWithUsers = await Promise.all(
      ratings.map(async (rating) => {
        const user = await ctx.db.get(rating.userId);
        return {
          ...rating,
          userName: user?.name || "Anonymous",
        };
      })
    );

    return ratingsWithUsers;
  },
});

/**
 * Get ratings for an NGO
 */
export const getNGORatings = mutation({
  args: {
    ngoId: v.id("ngos"),
  },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ngoRatings")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", args.ngoId))
      .collect();

    const ratingsWithUsers = await Promise.all(
      ratings.map(async (rating) => {
        const user = await ctx.db.get(rating.userId);
        return {
          ...rating,
          userName: user?.name || "Anonymous",
        };
      })
    );

    return ratingsWithUsers;
  },
});

/**
 * Get ratings for a campaign
 */
export const getCampaignRatings = mutation({
  args: {
    campaignId: v.id("fundraisingCampaigns"),
  },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("campaignRatings")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const ratingsWithUsers = await Promise.all(
      ratings.map(async (rating) => {
        const user = await ctx.db.get(rating.userId);
        return {
          ...rating,
          userName: user?.name || "Anonymous",
        };
      })
    );

    return ratingsWithUsers;
  },
});

/**
 * Batch update all popularity scores
 */
export const updateAllPopularityScores = internalMutation({
  handler: async (ctx) => {
    const hospitals = await ctx.db.query("hospitals").collect();
    for (const hospital of hospitals) {
      await ctx.scheduler.runAfter(0, internal.popularityScores.updateHospitalPopularity, {
        hospitalId: hospital._id,
      });
    }

    const ngos = await ctx.db.query("ngos").collect();
    for (const ngo of ngos) {
      await ctx.scheduler.runAfter(0, internal.popularityScores.updateNGOPopularity, {
        ngoId: ngo._id,
      });
    }

    const campaigns = await ctx.db.query("fundraisingCampaigns").collect();
    for (const campaign of campaigns) {
      await ctx.scheduler.runAfter(0, internal.popularityScores.updateCampaignPopularity, {
        campaignId: campaign._id,
      });
    }

    return { success: true };
  },
});