import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all reviews for a hospital
export const getHospitalReviews = query({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("hospitalRatings")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId))
      .collect();

    // Get user details for each rating
    const ratingsWithUsers = await Promise.all(
      ratings.map(async (rating) => {
        const user = await ctx.db.get(rating.userId);
        return {
          ...rating,
          user,
        };
      })
    );

    // Sort by most recent first
    return ratingsWithUsers.sort((a, b) => b.createdAt - a.createdAt);
  },
});