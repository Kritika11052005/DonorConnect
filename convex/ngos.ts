import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Note: You'll also need this query in your users.ts file
// export const getUserByClerkId = query({
//   args: { clerkId: v.string() },
//   handler: async (ctx, args) => {
//     return await ctx.db
//       .query("users")
//       .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
//       .unique();
//   },
// });

// Get all verified NGOs
export const getVerifiedNgos = query({
  handler: async (ctx) => {
    const ngos = await ctx.db
      .query("ngos")
      .withIndex("by_verified", (q) => q.eq("verified", true))
      .collect();

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

// Update NGO Profile (Setup Form)
export const updateNgoProfile = mutation({
  args: {
    userId: v.id("users"),
    organizationName: v.string(),
    registrationNumber: v.string(),
    description: v.string(),
    categories: v.array(v.string()),
    logo: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    phoneNumber: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    pincode: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, organizationName, registrationNumber, description, categories, logo, websiteUrl, phoneNumber, address, city, state, pincode } = args;

    // Update user table with contact info
    await ctx.db.patch(userId, {
      phoneNumber,
      address,
      city,
      state,
      pincode,
    });

    // Check if NGO exists
    const existingNgo = await ctx.db
      .query("ngos")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existingNgo) {
      // Update existing NGO
      await ctx.db.patch(existingNgo._id, {
        organizationName,
        registrationNumber,
        description,
        categories,
        logo,
        websiteUrl,
      });
      return existingNgo._id;
    } else {
      // Create new NGO
      const ngoId = await ctx.db.insert("ngos", {
        userId,
        organizationName,
        registrationNumber,
        description,
        categories,
        logo,
        websiteUrl,
        verified: false, // Admin will verify later
        averageRating: 0,
        totalRatings: 0,
        totalDonationsReceived: 0,
        totalAmountRaised: 0,
        totalVolunteers: 0,
        popularityScore: 0,
      });
      return ngoId;
    }
  },
});

// Get NGO's fundraising campaigns
export const getMyCampaigns = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const ngo = await ctx.db
      .query("ngos")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!ngo) return [];

    const campaigns = await ctx.db
      .query("fundraisingCampaigns")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", ngo._id))
      .collect();

    return campaigns;
  },
});

// Create fundraising campaign
export const createCampaign = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    targetAmount: v.number(),
    category: v.string(),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const ngo = await ctx.db
      .query("ngos")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!ngo) throw new Error("NGO profile not found");

    const campaignId = await ctx.db.insert("fundraisingCampaigns", {
      ngoId: ngo._id,
      title: args.title,
      description: args.description,
      targetAmount: args.targetAmount,
      raisedAmount: 0,
      startDate: Date.now(),
      endDate: args.endDate,
      category: args.category,
      status: "active",
      createdAt: Date.now(),
      averageRating: 0,
      totalRatings: 0,
      totalDonors: 0,
      popularityScore: 0,
    });

    return campaignId;
  },
});

// Update campaign
export const updateCampaign = mutation({
  args: {
    campaignId: v.id("fundraisingCampaigns"),
    title: v.string(),
    description: v.string(),
    targetAmount: v.number(),
    category: v.string(),
    endDate: v.optional(v.number()),
  status: v.optional(v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("draft")  // ← ADD THIS LINE
    )),
  },
  handler: async (ctx, args) => {
    const { campaignId, ...updates } = args;
    await ctx.db.patch(campaignId, updates);
    return campaignId;
  },
});

// Get donations received by NGO
// BEST FIX: Replace getMyDonations in convex/ngos.ts
// This version uses the index but with better error handling

export const getMyDonations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const ngo = await ctx.db
      .query("ngos")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!ngo) return [];

    console.log('🔍 Fetching donations for NGO:', {
      ngoId: ngo._id,
      ngoName: ngo.organizationName
    });

    // Method 1: Use the index (faster, but might miss donations with undefined ngoId)
    const indexedDonations = await ctx.db
      .query("donations")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", ngo._id))
      .collect();

    console.log('📊 Found donations via index:', indexedDonations.length);

    // Method 2: Also check for donations via campaigns (in case ngoId wasn't set directly)
    const campaigns = await ctx.db
      .query("fundraisingCampaigns")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", ngo._id))
      .collect();

    const campaignIds = campaigns.map(c => c._id);
    console.log('📊 NGO has campaigns:', campaignIds.length);

    // Get donations for all campaigns
    const campaignDonations = await Promise.all(
      campaignIds.map(async (campaignId) => {
        return await ctx.db
          .query("donations")
          .withIndex("by_campaignId", (q) => q.eq("campaignId", campaignId))
          .collect();
      })
    );

    const flatCampaignDonations = campaignDonations.flat();
    console.log('📊 Found campaign donations:', flatCampaignDonations.length);

    // Combine and deduplicate
    const allDonationIds = new Set<string>();
    const donations = [...indexedDonations, ...flatCampaignDonations].filter(d => {
      if (allDonationIds.has(d._id)) {
        return false;
      }
      allDonationIds.add(d._id);
      return true;
    });

    console.log('📊 Total unique donations:', donations.length);

    // Fetch donor details for each donation
    const donationsWithDetails = await Promise.all(
      donations.map(async (donation) => {
        const donor = await ctx.db.get(donation.donorId);
        const donorUser = donor ? await ctx.db.get(donor.userId) : null;
        return {
          ...donation,
          donor,
          donorUser,
        };
      })
    );

    // Sort by date (newest first)
    donationsWithDetails.sort((a, b) => b.donationDate - a.donationDate);

    return donationsWithDetails;
  },
});

// Get volunteers for NGO
export const getMyVolunteers = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const ngo = await ctx.db
      .query("ngos")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!ngo) return [];

    const volunteers = await ctx.db
      .query("volunteers")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", ngo._id))
      .collect();

    // Fetch donor details for each volunteer
    const volunteersWithDetails = await Promise.all(
      volunteers.map(async (volunteer) => {
        const donor = await ctx.db.get(volunteer.donorId);
        const donorUser = donor ? await ctx.db.get(donor.userId) : null;
        return {
          ...volunteer,
          donor,
          donorUser,
        };
      })
    );

    return volunteersWithDetails;
  },
});

// Get ratings for NGO
export const getMyRatings = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const ngo = await ctx.db
      .query("ngos")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!ngo) return [];

    const ratings = await ctx.db
      .query("ngoRatings")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", ngo._id))
      .collect();

    // Fetch user details for each rating
    const ratingsWithDetails = await Promise.all(
      ratings.map(async (rating) => {
        const ratingUser = await ctx.db.get(rating.userId);
        return {
          ...rating,
          user: ratingUser,
        };
      })
    );

    return ratingsWithDetails;
  },
});

// Get NGO statistics
export const getMyStatistics = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const ngo = await ctx.db
      .query("ngos")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!ngo) return null;

    // Get campaigns
    const campaigns = await ctx.db
      .query("fundraisingCampaigns")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", ngo._id))
      .collect();

    // Get donations
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", ngo._id))
      .collect();

    // Get volunteers
    const volunteers = await ctx.db
      .query("volunteers")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", ngo._id))
      .collect();

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === "active").length;
    const completedCampaigns = campaigns.filter(c => c.status === "completed").length;
    
    const totalDonations = donations.length;
    const totalAmountRaised = donations
      .filter(d => d.donationType === "money" && d.status === "completed")
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    const activeVolunteers = volunteers.filter(v => v.status === "active").length;
    const totalVolunteers = volunteers.length;

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalDonations,
      totalAmountRaised,
      activeVolunteers,
      totalVolunteers,
      averageRating: ngo.averageRating || 0,
      totalRatings: ngo.totalRatings || 0,
    };
  },
});
// Update volunteer status
export const updateVolunteerStatus = mutation({
  args: {
    volunteerId: v.id("volunteers"),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.volunteerId, {
      status: args.status,
    });
    return args.volunteerId;
  },
});
// Get single NGO by ID with user details
export const getNgoById = query({
  args: { ngoId: v.id("ngos") },
  handler: async (ctx, args) => {
    const ngo = await ctx.db.get(args.ngoId);
    
    if (!ngo) {
      return null;
    }

    const user = await ctx.db.get(ngo.userId);

    // Get campaigns count
    const campaigns = await ctx.db
      .query("fundraisingCampaigns")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", ngo._id))
      .collect();

    // Get volunteers count
    const volunteers = await ctx.db
      .query("volunteers")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", ngo._id))
      .collect();

    return {
      ...ngo,
      user,
      totalCampaigns: campaigns.length,
      activeVolunteers: volunteers.filter(v => v.status === "active").length,
    };
  },
});

// Get single campaign by ID with NGO details
export const getCampaignById = query({
  args: { campaignId: v.id("fundraisingCampaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    
    if (!campaign) {
      return null;
    }

    const ngo = await ctx.db.get(campaign.ngoId);
    const user = ngo ? await ctx.db.get(ngo.userId) : null;

    // Get donations for this campaign
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", campaign._id))
      .collect();

    return {
      ...campaign,
      ngo: ngo ? {
        ...ngo,
        user,
      } : null,
      donations,
    };
  },
});