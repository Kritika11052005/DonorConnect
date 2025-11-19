import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create organ donation pledge
export const createPledge = mutation({
  args: {
    organs: v.array(v.string()),
    pledgeDate: v.number(),
    medicalHistory: v.optional(v.string()),
    emergencyContactName: v.string(),
    emergencyContactPhone: v.string(),
    status: v.union(v.literal("active"), v.literal("utilized"), v.literal("revoked")),
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

    // Check if user is a donor
    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!donor) {
      throw new Error("Only donors can pledge organs");
    }

    // Check if donor already has an active organ pledge
    const existingPledge = await ctx.db
      .query("organDonationRegistry")
      .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existingPledge) {
      throw new Error("You already have an active organ donation pledge. Please revoke it first to create a new one.");
    }

    // Create organ donation registry entry
    const pledgeId = await ctx.db.insert("organDonationRegistry", {
      donorId: donor._id,
      organs: args.organs,
      pledgeDate: args.pledgeDate,
      medicalHistory: args.medicalHistory,
      emergencyContactName: args.emergencyContactName,
      emergencyContactPhone: args.emergencyContactPhone,
      status: args.status,
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: user._id,
      title: "Organ Donation Pledge Registered",
      message: `Thank you for pledging to donate ${args.organs.length} organ(s). Your decision can save lives!`,
      type: "organ_donation",
      read: false,
      createdAt: Date.now(),
    });

    return pledgeId;
  },
});

// Get current user's organ pledge
export const getMyPledge = query({
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

    const pledge = await ctx.db
      .query("organDonationRegistry")
      .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return pledge;
  },
});

// Revoke organ donation pledge
export const revokePledge = mutation({
  args: {
    pledgeId: v.id("organDonationRegistry"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const pledge = await ctx.db.get(args.pledgeId);
    if (!pledge) {
      throw new Error("Pledge not found");
    }

    // Verify ownership
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

    if (!donor || donor._id !== pledge.donorId) {
      throw new Error("You can only revoke your own pledge");
    }

    // Update pledge status
    await ctx.db.patch(args.pledgeId, {
      status: "revoked",
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: user._id,
      title: "Organ Donation Pledge Revoked",
      message: "Your organ donation pledge has been revoked as requested.",
      type: "organ_donation",
      read: false,
      createdAt: Date.now(),
    });

    return args.pledgeId;
  },
});

// Update organ donation pledge

export const updatePledge = mutation({
  args: {
    pledgeId: v.id("organDonationRegistry"),
    organs: v.optional(v.array(v.string())),
    medicalHistory: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const pledge = await ctx.db.get(args.pledgeId);
    if (!pledge) {
      throw new Error("Pledge not found");
    }

    // Verify ownership
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

    if (!donor || donor._id !== pledge.donorId) {
      throw new Error("You can only update your own pledge");
    }

    // Update pledge with proper typing
    const updateData: {
      organs?: string[];
      medicalHistory?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    } = {};
    
    if (args.organs) updateData.organs = args.organs;
    if (args.medicalHistory !== undefined) updateData.medicalHistory = args.medicalHistory;
    if (args.emergencyContactName) updateData.emergencyContactName = args.emergencyContactName;
    if (args.emergencyContactPhone) updateData.emergencyContactPhone = args.emergencyContactPhone;

    await ctx.db.patch(args.pledgeId, updateData);

    // Create notification
    await ctx.db.insert("notifications", {
      userId: user._id,
      title: "Organ Donation Pledge Updated",
      message: "Your organ donation pledge has been updated successfully.",
      type: "organ_donation",
      read: false,
      createdAt: Date.now(),
    });

    return args.pledgeId;
  },
});

// Get all active organ pledges (for hospitals/admin)
export const getActivePledges = query({
  handler: async (ctx) => {
    const pledges = await ctx.db
      .query("organDonationRegistry")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Fetch donor and user details
    const pledgesWithDetails = await Promise.all(
      pledges.map(async (pledge) => {
        const donor = await ctx.db.get(pledge.donorId);
        if (!donor) return null;

        const user = await ctx.db.get(donor.userId);
        return {
          ...pledge,
          donor,
          user,
        };
      })
    );

    return pledgesWithDetails.filter((p) => p !== null);
  },
});