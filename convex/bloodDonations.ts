import { mutation, query } from "./_generated/server";
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
    // Get authenticated user identity from Clerk
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Try to get the user from your users table
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    // If user doesn't exist, create them automatically
    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email ?? "",
        name: identity.name ?? identity.email ?? "Anonymous",
        role: "donor",
        createdAt: Date.now(),
      });
      
      user = await ctx.db.get(userId);
      
      if (!user) {
        throw new Error("Failed to create user");
      }
    }

    // Try to get the donor record
    let donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    // If donor doesn't exist, create them automatically
    if (!donor) {
      const donorId = await ctx.db.insert("donors", {
        userId: user._id,
        isOrganDonor: false,
        availableForBloodDonation: true,
      });
      
      donor = await ctx.db.get(donorId);
      
      if (!donor) {
        throw new Error("Failed to create donor profile");
      }
    }

    // **CRITICAL CHECK**: Verify no existing upcoming appointments before scheduling
    if (args.scheduleAppointment && args.preferredHospitalId && args.scheduledDate) {
      const existingAppointments = await ctx.db
        .query("bloodDonationAppointments")
        .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
        .filter((q) => q.eq(q.field("status"), "scheduled"))
        .collect();

      const now = Date.now();
      const hasUpcomingAppointment = existingAppointments.some(
        (apt) => apt.scheduledDate >= now
      );

      if (hasUpcomingAppointment) {
        throw new Error(
          "You already have an upcoming appointment. Please cancel it first to schedule a new one."
        );
      }
    }

    // Calculate next eligible donation date (90 days from last donation)
    const nextEligibleDate = args.lastDonationDate 
      ? args.lastDonationDate + (90 * 24 * 60 * 60 * 1000) // 90 days in milliseconds
      : undefined;

    // Update donor with last donation date and availability
    await ctx.db.patch(donor._id, {
      availableForBloodDonation: true,
      lastBloodDonationDate: args.lastDonationDate,
      nextEligibleBloodDonationDate: nextEligibleDate,
    });

    // If scheduling an appointment, create appointment record
    if (args.scheduleAppointment && args.preferredHospitalId && args.scheduledDate) {
      // Validate that scheduled date is not before next eligible date
      if (nextEligibleDate && args.scheduledDate < nextEligibleDate) {
        throw new Error(
          "Cannot schedule appointment before you are eligible to donate again"
        );
      }

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

    return { 
      success: true, 
      donorId: donor._id,
      message: "Blood donation signup completed successfully!"
    };
  },
});

export const getUpcomingAppointment = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!donor) return null;

    // Get all scheduled appointments for this donor
    const appointments = await ctx.db
      .query("bloodDonationAppointments")
      .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
      .filter((q) => q.eq(q.field("status"), "scheduled"))
      .collect();

    // Filter for upcoming appointments (future dates)
    const now = Date.now();
    const upcomingAppointments = appointments.filter(
      (apt) => apt.scheduledDate >= now
    );

    if (upcomingAppointments.length === 0) return null;

    // Return the nearest upcoming appointment
    const nearestAppointment = upcomingAppointments.sort(
      (a, b) => a.scheduledDate - b.scheduledDate
    )[0];

    // Get hospital details
    const hospital = await ctx.db.get(nearestAppointment.hospitalId);

    return {
      ...nearestAppointment,
      hospital,
    };
  },
});

export const cancelAppointment = mutation({
  args: {
    appointmentId: v.id("bloodDonationAppointments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify the appointment belongs to the current user
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
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

    if (!donor || donor._id !== appointment.donorId) {
      throw new Error("Unauthorized: This appointment does not belong to you");
    }

    // Cancel the appointment
    await ctx.db.patch(args.appointmentId, {
      status: "cancelled",
    });

    return { success: true, message: "Appointment cancelled successfully" };
  },
});

// Additional helper query to check if user can schedule appointment
export const canScheduleAppointment = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { canSchedule: false, reason: "Not authenticated" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return { canSchedule: false, reason: "User not found" };
    }

    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!donor) {
      return { canSchedule: true, reason: null };
    }

    // Check for existing upcoming appointments
    const appointments = await ctx.db
      .query("bloodDonationAppointments")
      .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
      .filter((q) => q.eq(q.field("status"), "scheduled"))
      .collect();

    const now = Date.now();
    const upcomingAppointment = appointments.find(
      (apt) => apt.scheduledDate >= now
    );

    if (upcomingAppointment) {
      const hospital = await ctx.db.get(upcomingAppointment.hospitalId);
      return {
        canSchedule: false,
        reason: "existing_appointment",
        appointment: {
          ...upcomingAppointment,
          hospital,
        },
      };
    }

    return { canSchedule: true, reason: null };
  },
});
// Get the last completed blood donation appointment
export const getLastCompletedDonation = query({
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

    // Find the most recent completed blood donation appointment
    const completedAppointments = await ctx.db
      .query("bloodDonationAppointments")
      .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    if (completedAppointments.length === 0) {
      return null;
    }

    // Sort by completedAt if available, otherwise use scheduledDate
    const sortedAppointments = completedAppointments.sort((a, b) => {
      const dateA = a.completedAt || a.scheduledDate;
      const dateB = b.completedAt || b.scheduledDate;
      return (dateB || 0) - (dateA || 0);
    });

    return sortedAppointments[0] || null;
  },
});