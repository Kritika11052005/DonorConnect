import { query } from "./_generated/server";

// Get all verified NGOs
export const getVerifiedNgos = query({
  handler: async (ctx) => {
    const ngos = await ctx.db
      .query("ngos")
      .withIndex("by_verified", (q) => q.eq("verified", true))
      .collect();

    // Fetch user details for each NGO
    const ngosWithDetails = await Promise.all(
      ngos.map(async (ngo) => {
        const user = await ctx.db.get(ngo.userId);
        return {
          ...ngo,
          user,
        };
      })
    );

    return ngosWithDetails;
  },
});

// Get all NGOs (for admin)
export const getAllNgos = query({
  handler: async (ctx) => {
    const ngos = await ctx.db.query("ngos").collect();

    const ngosWithDetails = await Promise.all(
      ngos.map(async (ngo) => {
        const user = await ctx.db.get(ngo.userId);
        return {
          ...ngo,
          user,
        };
      })
    );

    return ngosWithDetails;
  },
});

// Get NGO by user ID
export const getMyNgo = query({
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

    const ngo = await ctx.db
      .query("ngos")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    return ngo;
  },
});