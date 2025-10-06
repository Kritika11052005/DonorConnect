import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createBloodDonationSignup = mutation({
  args: {
    lastDonationDate: v.optional(v.number()),
    weight: v.number(),
    medicalConditions: v.string(),
    availableDays: v.array(v.string()),
    scheduleAppointment: v.boolean(),
    preferredHospitalId: v.optional(v.id("hospitals")),
    scheduledDate: v.optional(v.number()),
    scheduledTime: v.string(),
    appointmentNotes: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the donor record
    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!donor) {
      throw new Error("Donor profile not found");
    }

    // Update donor with last donation date and availability
    await ctx.db.patch(donor._id, {
      availableForBloodDonation: true,
      lastBloodDonationDate: args.lastDonationDate,
      nextEligibleBloodDonationDate: args.lastDonationDate 
        ? args.lastDonationDate + (90 * 24 * 60 * 60 * 1000) // 90 days in milliseconds
        : undefined,
    });

    // If scheduling an appointment, create appointment record
    if (args.scheduleAppointment && args.preferredHospitalId && args.scheduledDate) {
      await ctx.db.insert("bloodDonationAppointments", {
        donorId: donor._id,
        hospitalId: args.preferredHospitalId,
        scheduledDate: args.scheduledDate,
        scheduledTime: args.scheduledTime,
        status: "scheduled",
        notes: args.appointmentNotes,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});