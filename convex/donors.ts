import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Update donor profile with gender
export const updateDonorProfile = mutation({
  args: {
    userId: v.id("users"),
    phoneNumber: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    pincode: v.string(),
    dateOfBirth: v.string(),
    bloodGroup: v.union(
      v.literal("A+"), v.literal("A-"),
      v.literal("B+"), v.literal("B-"),
      v.literal("AB+"), v.literal("AB-"),
      v.literal("O+"), v.literal("O-")
    ),
    gender: v.union(
      v.literal("male"),
      v.literal("female"),
      v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    const { userId, phoneNumber, address, city, state, pincode, dateOfBirth, bloodGroup, gender } = args;

    // Update user table
    await ctx.db.patch(userId, {
      phoneNumber,
      address,
      city,
      state,
      pincode,
    });

    // Update or create donor table entry
    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (donor) {
      // Update existing donor
      await ctx.db.patch(donor._id, {
        bloodGroup,
        dateOfBirth,
        gender,
      });
    } else {
      // Create new donor record
      await ctx.db.insert("donors", {
        userId,
        bloodGroup,
        dateOfBirth,
        gender,
        isOrganDonor: false,
        availableForBloodDonation: true,
      });
    }

    return { success: true };
  },
});

// Check if donor profile is complete
export const isDonorProfileComplete = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return { complete: false, user: null, donor: null };

    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    const isComplete = !!(
      user.phoneNumber &&
      user.address &&
      user.city &&
      user.state &&
      user.pincode &&
      donor?.bloodGroup &&
      donor?.dateOfBirth &&
      donor?.gender
    );

    return { complete: isComplete, user, donor };
  },
});

// Update donor's organ donor status
export const updateOrganDonorStatus = mutation({
  args: {
    isOrganDonor: v.boolean(),
    organDonorPledgeDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get donor record
    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!donor) {
      throw new Error("Donor record not found");
    }

    // Update donor record
    await ctx.db.patch(donor._id, {
      isOrganDonor: args.isOrganDonor,
      organDonorPledgeDate: args.organDonorPledgeDate,
    });

    return donor._id;
  },
});

// Get current donor profile
export const getMyProfile = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!donor) {
      return null;
    }

    return {
      ...donor,
      user,
    };
  },
});

// Update donor blood donation availability
export const updateBloodDonationAvailability = mutation({
  args: {
    availableForBloodDonation: v.boolean(),
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

    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!donor) {
      throw new Error("Donor record not found");
    }

    await ctx.db.patch(donor._id, {
      availableForBloodDonation: args.availableForBloodDonation,
    });

    return donor._id;
  },
});

// Get all organ donors
export const getOrganDonors = query({
  handler: async (ctx) => {
    const donors = await ctx.db
      .query("donors")
      .withIndex("by_organDonor", (q) => q.eq("isOrganDonor", true))
      .collect();

    const donorsWithUser = await Promise.all(
      donors.map(async (donor) => {
        const user = await ctx.db.get(donor.userId);
        return {
          ...donor,
          user,
        };
      })
    );

    return donorsWithUser;
  },
});