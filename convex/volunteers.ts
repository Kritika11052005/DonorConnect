import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new volunteer registration
export const create = mutation({
  args: {
    ngoId: v.id("ngos"),
    startDate: v.number(),
    endDate: v.number(),
    role: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    hoursContributed: v.optional(v.number()),
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
      throw new Error("Only donors can register as volunteers");
    }

    // Check if NGO exists and is verified
    const ngo = await ctx.db.get(args.ngoId);
    if (!ngo) {
      throw new Error("NGO not found");
    }
    if (!ngo.verified) {
      throw new Error("Cannot volunteer for unverified NGO");
    }

    // Get all active volunteer registrations
    const activeVolunteers = await ctx.db
      .query("volunteers")
      .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Auto-complete expired registrations
    const now = Date.now();
    for (const volunteer of activeVolunteers) {
      if (volunteer.endDate < now) {
        await ctx.db.patch(volunteer._id, {
          status: "completed",
        });
      }
    }

    // Check again for active registrations (excluding expired ones)
    const stillActiveVolunteer = activeVolunteers.find(
      (v) => v.endDate >= now
    );

    if (stillActiveVolunteer) {
      const existingNgo = await ctx.db.get(stillActiveVolunteer.ngoId);
      throw new Error(
        `You already have an active volunteer registration with ${existingNgo?.organizationName}. Please cancel it first to register with a new NGO.`
      );
    }

    // Create volunteer entry
    const volunteerId = await ctx.db.insert("volunteers", {
      donorId: donor._id,
      ngoId: args.ngoId,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status,
      role: args.role,
      hoursContributed: args.hoursContributed || 0,
    });

    // Create notification for the user
    await ctx.db.insert("notifications", {
      userId: user._id,
      title: "Volunteer Registration Confirmed",
      message: `You have successfully registered as a volunteer with ${ngo.organizationName}. Your volunteering period starts soon!`,
      type: "volunteer",
      read: false,
      createdAt: Date.now(),
    });

    return volunteerId;
  },
});

// Get active volunteer registration for current donor (for form check)
export const getActiveVolunteerRegistration = query({
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

    // Get active volunteer registration
    const activeVolunteer = await ctx.db
      .query("volunteers")
      .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!activeVolunteer) return null;

    // Check if it's still within the volunteering period
    const now = Date.now();
    if (activeVolunteer.endDate < now) {
      // Don't modify in query - just return null
      // A scheduled mutation or the create function will handle auto-completion
      return null;
    }

    // Get NGO details
    const ngo = await ctx.db.get(activeVolunteer.ngoId);

    return {
      ...activeVolunteer,
      ngo,
    };
  },
});

// Get all volunteer registrations for current donor
export const getMyVolunteerRegistrations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!donor) {
      return [];
    }

    const volunteers = await ctx.db
      .query("volunteers")
      .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
      .collect();

    // Fetch NGO details for each volunteer registration
    const volunteersWithNgo = await Promise.all(
      volunteers.map(async (volunteer) => {
        const ngo = await ctx.db.get(volunteer.ngoId);
        return {
          ...volunteer,
          ngo,
        };
      })
    );

    return volunteersWithNgo;
  },
});

// Get volunteers for a specific NGO (for NGO dashboard)
export const getVolunteersForNgo = query({
  args: { ngoId: v.id("ngos") },
  handler: async (ctx, args) => {
    const volunteers = await ctx.db
      .query("volunteers")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", args.ngoId))
      .collect();

    // Fetch donor and user details
    const volunteersWithDetails = await Promise.all(
      volunteers.map(async (volunteer) => {
        const donor = await ctx.db.get(volunteer.donorId);
        if (!donor) return null;
        
        const user = await ctx.db.get(donor.userId);
        return {
          ...volunteer,
          donor,
          user,
        };
      })
    );

    return volunteersWithDetails.filter((v) => v !== null);
  },
});

// Update volunteer status
export const updateStatus = mutation({
  args: {
    volunteerId: v.id("volunteers"),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const volunteer = await ctx.db.get(args.volunteerId);
    if (!volunteer) {
      throw new Error("Volunteer registration not found");
    }

    // Verify the volunteer registration belongs to the current user
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

    if (!donor || donor._id !== volunteer.donorId) {
      throw new Error("Unauthorized: This volunteer registration does not belong to you");
    }

    await ctx.db.patch(args.volunteerId, {
      status: args.status,
    });

    return args.volunteerId;
  },
});

// Update hours contributed
export const updateHours = mutation({
  args: {
    volunteerId: v.id("volunteers"),
    hours: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const volunteer = await ctx.db.get(args.volunteerId);
    if (!volunteer) {
      throw new Error("Volunteer registration not found");
    }

    await ctx.db.patch(args.volunteerId, {
      hoursContributed: (volunteer.hoursContributed || 0) + args.hours,
    });

    return args.volunteerId;
  },
});

// Utility mutation to auto-complete expired volunteer registrations
export const autoCompleteExpiredRegistrations = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all active volunteers
    const activeVolunteers = await ctx.db
      .query("volunteers")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let completedCount = 0;

    // Mark expired registrations as completed
    for (const volunteer of activeVolunteers) {
      if (volunteer.endDate < now) {
        await ctx.db.patch(volunteer._id, {
          status: "completed",
        });
        completedCount++;
      }
    }

    return { completedCount };
  },
});