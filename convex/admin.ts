import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all hospitals with user details (for admin)
export const getAllHospitals = query({
  handler: async (ctx) => {
    const hospitals = await ctx.db.query("hospitals").collect();

    const hospitalsWithDetails = await Promise.all(
      hospitals.map(async (hospital) => {
        const user = await ctx.db.get(hospital.userId);
        return {
          ...hospital,
          user,
        };
      })
    );

    return hospitalsWithDetails;
  },
});

// Get all NGOs with user details (for admin)
export const getAllNgos = query({
  handler: async (ctx) => {
    const ngos = await ctx.db.query("ngos").collect();

    const ngosWithDetails = await Promise.all(
      ngos.map(async (ngo) => {
        const user = await ctx.db.get(ngo.userId);
        
        // Get additional stats
        const campaigns = await ctx.db
          .query("fundraisingCampaigns")
          .withIndex("by_ngoId", (q) => q.eq("ngoId", ngo._id))
          .collect();
        
        const donations = await ctx.db
          .query("donations")
          .withIndex("by_ngoId", (q) => q.eq("ngoId", ngo._id))
          .collect();

        const volunteers = await ctx.db
          .query("volunteers")
          .withIndex("by_ngoId", (q) => q.eq("ngoId", ngo._id))
          .collect();

        return {
          ...ngo,
          user,
          totalCampaigns: campaigns.length,
          totalDonations: donations.length,
          totalVolunteers: volunteers.length,
        };
      })
    );

    return ngosWithDetails;
  },
});

// Verify/Unverify Hospital
export const updateHospitalVerification = mutation({
  args: {
    hospitalId: v.id("hospitals"),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const hospital = await ctx.db.get(args.hospitalId);
    
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    await ctx.db.patch(args.hospitalId, {
      verified: args.verified,
    });

    // Create notification for the hospital
    const user = await ctx.db.get(hospital.userId);
    if (user) {
      await ctx.db.insert("notifications", {
        userId: user._id,
        title: args.verified ? "Hospital Verified! 🎉" : "Verification Revoked",
        message: args.verified 
          ? `Congratulations! Your hospital "${hospital.hospitalName}" has been verified by our admin team.`
          : `Your hospital verification has been revoked. Please contact support for more information.`,
        type: "system",
        read: false,
        createdAt: Date.now(),
      });
    }

    return args.hospitalId;
  },
});

// Verify/Unverify NGO
export const updateNgoVerification = mutation({
  args: {
    ngoId: v.id("ngos"),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const ngo = await ctx.db.get(args.ngoId);
    
    if (!ngo) {
      throw new Error("NGO not found");
    }

    await ctx.db.patch(args.ngoId, {
      verified: args.verified,
    });

    // Create notification for the NGO
    const user = await ctx.db.get(ngo.userId);
    if (user) {
      await ctx.db.insert("notifications", {
        userId: user._id,
        title: args.verified ? "NGO Verified! 🎉" : "Verification Revoked",
        message: args.verified 
          ? `Congratulations! Your organization "${ngo.organizationName}" has been verified by our admin team.`
          : `Your NGO verification has been revoked. Please contact support for more information.`,
        type: "system",
        read: false,
        createdAt: Date.now(),
      });
    }

    return args.ngoId;
  },
});

// Delete Hospital (with all related data)
export const deleteHospital = mutation({
  args: {
    hospitalId: v.id("hospitals"),
  },
  handler: async (ctx, args) => {
    const hospital = await ctx.db.get(args.hospitalId);
    
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    // Delete related records
    // 1. Blood donation requests
    const bloodRequests = await ctx.db
      .query("bloodDonationRequests")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId))
      .collect();
    for (const request of bloodRequests) {
      await ctx.db.delete(request._id);
    }

    // 2. Blood donation appointments
    const appointments = await ctx.db
      .query("bloodDonationAppointments")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId))
      .collect();
    for (const appointment of appointments) {
      await ctx.db.delete(appointment._id);
    }

    // 3. Organ transplant requests
    const organRequests = await ctx.db
      .query("organTransplantRequests")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId))
      .collect();
    for (const request of organRequests) {
      await ctx.db.delete(request._id);
    }

    // 4. Hospital organ availability
    const organs = await ctx.db
      .query("hospitalOrganAvailability")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId))
      .collect();
    for (const organ of organs) {
      await ctx.db.delete(organ._id);
    }

    // 5. Hospital ratings
    const ratings = await ctx.db
      .query("hospitalRatings")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId))
      .collect();
    for (const rating of ratings) {
      await ctx.db.delete(rating._id);
    }

    // Delete the hospital
    await ctx.db.delete(args.hospitalId);

    // Note: We don't delete the user account, only the hospital profile
    return true;
  },
});

// Delete NGO (with all related data)
export const deleteNgo = mutation({
  args: {
    ngoId: v.id("ngos"),
  },
  handler: async (ctx, args) => {
    const ngo = await ctx.db.get(args.ngoId);
    
    if (!ngo) {
      throw new Error("NGO not found");
    }

    // Delete related records
    // 1. Campaigns
    const campaigns = await ctx.db
      .query("fundraisingCampaigns")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", args.ngoId))
      .collect();
    for (const campaign of campaigns) {
      // Delete campaign ratings
      const campaignRatings = await ctx.db
        .query("campaignRatings")
        .withIndex("by_campaignId", (q) => q.eq("campaignId", campaign._id))
        .collect();
      for (const rating of campaignRatings) {
        await ctx.db.delete(rating._id);
      }
      await ctx.db.delete(campaign._id);
    }

    // 2. Donations
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", args.ngoId))
      .collect();
    for (const donation of donations) {
      await ctx.db.delete(donation._id);
    }

    // 3. Volunteers
    const volunteers = await ctx.db
      .query("volunteers")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", args.ngoId))
      .collect();
    for (const volunteer of volunteers) {
      await ctx.db.delete(volunteer._id);
    }

    // 4. NGO ratings
    const ratings = await ctx.db
      .query("ngoRatings")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", args.ngoId))
      .collect();
    for (const rating of ratings) {
      await ctx.db.delete(rating._id);
    }

    // Delete the NGO
    await ctx.db.delete(args.ngoId);

    // Note: We don't delete the user account, only the NGO profile
    return true;
  },
});

// Get admin statistics
export const getAdminStats = query({
  handler: async (ctx) => {
    const hospitals = await ctx.db.query("hospitals").collect();
    const ngos = await ctx.db.query("ngos").collect();
    const users = await ctx.db.query("users").collect();
    
    const verifiedHospitals = hospitals.filter(h => h.verified).length;
    const unverifiedHospitals = hospitals.filter(h => !h.verified).length;
    const verifiedNgos = ngos.filter(n => n.verified).length;
    const unverifiedNgos = ngos.filter(n => !n.verified).length;

    const totalDonors = users.filter(u => u.role === "donor").length;
    const totalAdmins = users.filter(u => u.role === "admin").length;

    return {
      totalHospitals: hospitals.length,
      verifiedHospitals,
      unverifiedHospitals,
      totalNgos: ngos.length,
      verifiedNgos,
      unverifiedNgos,
      totalDonors,
      totalAdmins,
      totalUsers: users.length,
    };
  },
});