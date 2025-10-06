import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Create or update user from Clerk webhook
export const createUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("donor"),
      v.literal("hospital"),
      v.literal("ngo"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // If role changed, handle role-specific tables
      if (existingUser.role !== args.role) {
        // Delete old role record
        if (existingUser.role === "donor") {
          const oldDonor = await ctx.db
            .query("donors")
            .withIndex("by_userId", (q) => q.eq("userId", existingUser._id))
            .unique();
          if (oldDonor) await ctx.db.delete(oldDonor._id);
        } else if (existingUser.role === "hospital") {
          const oldHospital = await ctx.db
            .query("hospitals")
            .withIndex("by_userId", (q) => q.eq("userId", existingUser._id))
            .unique();
          if (oldHospital) await ctx.db.delete(oldHospital._id);
        } else if (existingUser.role === "ngo") {
          const oldNgo = await ctx.db
            .query("ngos")
            .withIndex("by_userId", (q) => q.eq("userId", existingUser._id))
            .unique();
          if (oldNgo) await ctx.db.delete(oldNgo._id);
        }

        // Create new role record
        if (args.role === "donor") {
          await ctx.db.insert("donors", {
            userId: existingUser._id,
            isOrganDonor: false,
            availableForBloodDonation: false,
          });
        } else if (args.role === "hospital") {
          await ctx.db.insert("hospitals", {
            userId: existingUser._id,
            hospitalName: args.name,
            description: "",
            registrationNumber: "",
            hospitalType: "private",
            verified: false,
            specializations: [],
          });
        } else if (args.role === "ngo") {
          await ctx.db.insert("ngos", {
            userId: existingUser._id,
            organizationName: args.name,
            registrationNumber: "",
            description: "",
            verified: false,
            categories: [],
          });
        }
      }

      // Update user record
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        role: args.role,
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      role: args.role,
      createdAt: Date.now(),
    });

    // Create role-specific record
    if (args.role === "donor") {
      await ctx.db.insert("donors", {
        userId: userId,
        isOrganDonor: false,
        availableForBloodDonation: false,
      });
    } else if (args.role === "hospital") {
      await ctx.db.insert("hospitals", {
        userId: userId,
        hospitalName: args.name,
        description: "",
        registrationNumber: "",
        hospitalType: "private",
        verified: false,
        specializations: [],
      });
    } else if (args.role === "ngo") {
      await ctx.db.insert("ngos", {
        userId: userId,
        organizationName: args.name,
        registrationNumber: "",
        description: "",
        verified: false,
        categories: [],
      });
    }

    return userId;
  },
});



// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Get user with role-specific data
export const getUserWithRoleData = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return null;

    let roleData = null;

    if (user.role === "donor") {
      roleData = await ctx.db
        .query("donors")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
    } else if (user.role === "ngo") {
      roleData = await ctx.db
        .query("ngos")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
    } else if (user.role === "hospital") {
      roleData = await ctx.db
        .query("hospitals")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
    }

    return { ...user, roleData };
  },
});