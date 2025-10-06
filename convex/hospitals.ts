import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all verified hospitals
export const getAllVerifiedHospitals = query({
  args: {},
  handler: async (ctx) => {
    const hospitals = await ctx.db
      .query("hospitals")
      .withIndex("by_verified", (q) => q.eq("verified", true))
      .collect();

    // Join with user data to get location info
    const hospitalsWithDetails = await Promise.all(
      hospitals.map(async (hospital) => {
        const user = await ctx.db.get(hospital.userId);
        return {
          _id: hospital._id,
          hospitalName: hospital.hospitalName,
          city: user?.city || "",
          state: user?.state || "",
          address: user?.address || "",
          hospitalType: hospital.hospitalType,
          specializations: hospital.specializations,
        };
      })
    );

    return hospitalsWithDetails;
  },
});