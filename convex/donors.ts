import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Update donor profile
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
  },
  handler: async (ctx, args) => {
    const { userId, phoneNumber, address, city, state, pincode, dateOfBirth, bloodGroup } = args;

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
      });
    } else {
      // Create new donor record
      await ctx.db.insert("donors", {
        userId,
        bloodGroup,
        dateOfBirth,
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
      donor?.dateOfBirth
    );

    return { complete: isComplete, user, donor };
  },
});