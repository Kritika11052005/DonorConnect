// convex/donations.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create physical donation with pickup details
export const createPhysicalDonation = mutation({
  args: {
    targetType: v.union(v.literal("ngo"), v.literal("campaign")),
    targetId: v.string(),
    donationType: v.union(
      v.literal("books"),
      v.literal("clothes"),
      v.literal("food")
    ),
    quantity: v.number(),
    unit: v.string(),
    description: v.string(),
    pickupAddress: v.string(),
    pickupCity: v.string(),
    pickupState: v.string(),
    pickupPincode: v.string(),
    pickupDate: v.number(),
    pickupTime: v.string(),
    contactPhone: v.string(),
    specialInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get donor record
    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!donor) {
      throw new Error("Donor profile not found");
    }

    // Validate and get target
    let ngoId: Id<"ngos"> | undefined = undefined;
    let campaignId: Id<"fundraisingCampaigns"> | undefined = undefined;

    if (args.targetType === "ngo") {
      const ngo = await ctx.db.get(args.targetId as Id<"ngos">);
      if (!ngo) {
        throw new Error("NGO not found");
      }
      ngoId = args.targetId as Id<"ngos">;
    } else if (args.targetType === "campaign") {
      const campaign = await ctx.db.get(args.targetId as Id<"fundraisingCampaigns">);
      if (!campaign) {
        throw new Error("Campaign not found");
      }
      campaignId = args.targetId as Id<"fundraisingCampaigns">;
      ngoId = campaign.ngoId; // Also link to the NGO
    }

    // Format full pickup address
    const fullPickupAddress = `${args.pickupAddress}, ${args.pickupCity}, ${args.pickupState} - ${args.pickupPincode}`;

    // Create donation record
    const donationId = await ctx.db.insert("donations", {
      donorId: donor._id,
      ngoId: ngoId,
      campaignId: campaignId,
      donationType: args.donationType,
      quantity: args.quantity,
      unit: args.unit,
      description: args.description,
      donationDate: Date.now(),
      pickupScheduled: true,
      pickupDate: args.pickupDate,
      pickupAddress: fullPickupAddress,
      status: "scheduled",
      taxReceiptGenerated: false,
      createdAt: Date.now(),
    });

    // Create notification for the NGO owner
    if (ngoId) {
      const ngo = await ctx.db.get(ngoId);
      if (ngo) {
        await ctx.db.insert("notifications", {
          userId: ngo.userId,
          title: "New Donation Scheduled",
          message: `${user.name} has scheduled a ${args.donationType} donation (${args.quantity} ${args.unit}) for pickup on ${new Date(args.pickupDate).toLocaleDateString('en-IN')} at ${args.pickupTime}. Contact: ${args.contactPhone}`,
          type: "donation",
          read: false,
          createdAt: Date.now(),
        });

        // Update NGO stats
        await ctx.db.patch(ngoId, {
          totalDonationsReceived: (ngo.totalDonationsReceived || 0) + 1,
        });
      }
    }

    // Update campaign stats if applicable
    if (campaignId) {
      const campaign = await ctx.db.get(campaignId);
      if (campaign) {
        await ctx.db.patch(campaignId, {
          totalDonors: (campaign.totalDonors || 0) + 1,
        });
      }
    }

    return {
      donationId,
      message: "Donation scheduled successfully",
      pickupDetails: {
        date: args.pickupDate,
        time: args.pickupTime,
        address: fullPickupAddress,
        phone: args.contactPhone,
      },
    };
  },
});

// Get donations for a donor (their donation history)
export const getMyDonations = query({
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

    const donations = await ctx.db
      .query("donations")
      .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
      .order("desc")
      .collect();

    // Enrich with target details
    const enrichedDonations = await Promise.all(
      donations.map(async (donation) => {
        let targetName = "Unknown";
        let targetType: "ngo" | "campaign" | null = null;
        
        if (donation.ngoId) {
          const ngo = await ctx.db.get(donation.ngoId);
          targetName = ngo?.organizationName || "NGO";
          targetType = "ngo";
        }
        
        if (donation.campaignId) {
          const campaign = await ctx.db.get(donation.campaignId);
          targetName = campaign?.title || "Campaign";
          targetType = "campaign";
        }

        return {
          ...donation,
          targetName,
          targetType,
        };
      })
    );

    return enrichedDonations;
  },
});

// Get donations received by an NGO
export const getNGODonations = query({
  args: {
    ngoId: v.id("ngos"),
  },
  handler: async (ctx, args) => {
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", args.ngoId))
      .order("desc")
      .collect();

    // Enrich with donor details
    const enrichedDonations = await Promise.all(
      donations.map(async (donation) => {
        const donor = await ctx.db.get(donation.donorId);
        const user = donor ? await ctx.db.get(donor.userId) : null;

        let campaignName: string | null = null;
        if (donation.campaignId) {
          const campaign = await ctx.db.get(donation.campaignId);
          campaignName = campaign?.title || null;
        }

        return {
          ...donation,
          donorName: user?.name || "Anonymous",
          donorEmail: user?.email || "",
          donorPhone: user?.phoneNumber || "",
          campaignName,
        };
      })
    );

    return enrichedDonations;
  },
});

// Get donations for a campaign
export const getCampaignDonations = query({
  args: {
    campaignId: v.id("fundraisingCampaigns"),
  },
  handler: async (ctx, args) => {
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .order("desc")
      .collect();

    // Enrich with donor details
    const enrichedDonations = await Promise.all(
      donations.map(async (donation) => {
        const donor = await ctx.db.get(donation.donorId);
        const user = donor ? await ctx.db.get(donor.userId) : null;

        return {
          ...donation,
          donorName: user?.name || "Anonymous",
          donorEmail: user?.email || "",
        };
      })
    );

    return enrichedDonations;
  },
});

// Get single donation by ID
export const getDonationById = query({
  args: {
    donationId: v.id("donations"),
  },
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    
    if (!donation) {
      return null;
    }

    // Get donor details
    const donor = await ctx.db.get(donation.donorId);
    const donorUser = donor ? await ctx.db.get(donor.userId) : null;

    // Get target details
    let ngoDetails = null;
    let campaignDetails = null;

    if (donation.ngoId) {
      const ngo = await ctx.db.get(donation.ngoId);
      const ngoUser = ngo ? await ctx.db.get(ngo.userId) : null;
      ngoDetails = ngo ? { ...ngo, user: ngoUser } : null;
    }

    if (donation.campaignId) {
      const campaign = await ctx.db.get(donation.campaignId);
      campaignDetails = campaign;
    }

    return {
      ...donation,
      donor,
      donorUser,
      ngo: ngoDetails,
      campaign: campaignDetails,
    };
  },
});

// Update donation status (for NGO to manage pickups)
export const updateDonationStatus = mutation({
  args: {
    donationId: v.id("donations"),
    status: v.union(
      v.literal("pending"),
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const donation = await ctx.db.get(args.donationId);
    if (!donation) {
      throw new Error("Donation not found");
    }

    // Verify the user is authorized (either NGO owner or admin)
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user owns the NGO
    if (donation.ngoId) {
      const ngo = await ctx.db.get(donation.ngoId);
      if (ngo && ngo.userId !== user._id && user.role !== "admin") {
        throw new Error("Not authorized to update this donation");
      }
    }

    await ctx.db.patch(args.donationId, {
      status: args.status,
    });

    // Notify donor of status change
    const donor = await ctx.db.get(donation.donorId);
    if (donor) {
      const statusMessages: Record<typeof args.status, string> = {
        pending: "Your donation is pending review",
        scheduled: "Your donation pickup has been scheduled",
        completed: "Your donation has been successfully received. Thank you!",
        cancelled: "Your donation has been cancelled",
      };

      await ctx.db.insert("notifications", {
        userId: donor.userId,
        title: "Donation Status Updated",
        message: statusMessages[args.status],
        type: "donation",
        read: false,
        createdAt: Date.now(),
      });
    }

    return { success: true, donationId: args.donationId };
  },
});

// Get donation statistics for NGO dashboard
export const getNGODonationStats = query({
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

    if (!ngo) {
      return null;
    }

    const donations = await ctx.db
      .query("donations")
      .withIndex("by_ngoId", (q) => q.eq("ngoId", ngo._id))
      .collect();

    const totalDonations = donations.length;
    const scheduledPickups = donations.filter(d => d.status === "scheduled").length;
    const completedDonations = donations.filter(d => d.status === "completed").length;
    const pendingDonations = donations.filter(d => d.status === "pending").length;

    // Group by donation type
    const booksDonations = donations.filter(d => d.donationType === "books").length;
    const clothesDonations = donations.filter(d => d.donationType === "clothes").length;
    const foodDonations = donations.filter(d => d.donationType === "food").length;
    const moneyDonations = donations.filter(d => d.donationType === "money").length;

    // Calculate total money raised
    const totalMoneyRaised = donations
      .filter(d => d.donationType === "money" && d.status === "completed")
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    return {
      totalDonations,
      scheduledPickups,
      completedDonations,
      pendingDonations,
      booksDonations,
      clothesDonations,
      foodDonations,
      moneyDonations,
      totalMoneyRaised,
    };
  },
});

// Get donation statistics for donor dashboard
export const getDonorDonationStats = query({
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

    const donations = await ctx.db
      .query("donations")
      .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
      .collect();

    const totalDonations = donations.length;
    const scheduledPickups = donations.filter(d => d.status === "scheduled").length;
    const completedDonations = donations.filter(d => d.status === "completed").length;

    // Calculate total money donated
    const totalMoneyDonated = donations
      .filter(d => d.donationType === "money" && d.status === "completed")
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    // Count by type
    const physicalDonations = donations.filter(d => 
      d.donationType === "books" || d.donationType === "clothes" || d.donationType === "food"
    ).length;

    return {
      totalDonations,
      scheduledPickups,
      completedDonations,
      totalMoneyDonated,
      physicalDonations,
    };
  },
});

// Cancel donation (by donor)
export const cancelDonation = mutation({
  args: {
    donationId: v.id("donations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
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

    if (!donor) {
      throw new Error("Donor profile not found");
    }

    const donation = await ctx.db.get(args.donationId);
    if (!donation) {
      throw new Error("Donation not found");
    }

    // Verify the donor owns this donation
    if (donation.donorId !== donor._id) {
      throw new Error("Not authorized to cancel this donation");
    }

    // Can only cancel scheduled donations
    if (donation.status !== "scheduled" && donation.status !== "pending") {
      throw new Error("Can only cancel scheduled or pending donations");
    }

    await ctx.db.patch(args.donationId, {
      status: "cancelled",
    });

    // Notify NGO of cancellation
    if (donation.ngoId) {
      const ngo = await ctx.db.get(donation.ngoId);
      if (ngo) {
        await ctx.db.insert("notifications", {
          userId: ngo.userId,
          title: "Donation Cancelled",
          message: `${user.name} has cancelled their ${donation.donationType} donation scheduled for ${new Date(donation.pickupDate || 0).toLocaleDateString('en-IN')}`,
          type: "donation",
          read: false,
          createdAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});