// convex/payments.ts
import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
// Create payment session
export const createPaymentSession = mutation({
    args: {
        clerkUserId: v.string(),
        targetType: v.union(v.literal("ngo"), v.literal("campaign")),
        targetId: v.string(),
        stripeSessionId: v.string(),
        amount: v.number(),
        currency: v.string(),
        paymentType: v.union(v.literal("one_time"), v.literal("recurring")),
        donationItemType: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkUserId))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        const sessionId = await ctx.db.insert("stripePaymentSessions", {
            userId: user._id,
            donationType: args.targetType,
            targetId: args.targetId as Id<"ngos"> | Id<"fundraisingCampaigns">,
            stripeSessionId: args.stripeSessionId,
            amount: args.amount,
            currency: args.currency,
            status: "pending",
            paymentType: args.paymentType,
            donationItemType: args.donationItemType as "money" | "books" | "clothes" | "food" | undefined,
            createdAt: Date.now(),
        });

        return sessionId;
    },
});

// Complete payment and create donation
// Enhanced completePayment mutation with better logging
// Replace the existing completePayment in convex/payments.ts

// Replace completePayment in convex/payments.ts

// Replace completePayment in convex/payments.ts

export const completePayment = mutation({
  args: {
    stripeSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('🔵 completePayment START:', args.stripeSessionId);

    // Get payment session
    const paymentSession = await ctx.db
      .query("stripePaymentSessions")
      .withIndex("by_stripeSessionId", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId)
      )
      .unique();

    if (!paymentSession) {
      console.error('❌ Payment session not found');
      throw new Error("Payment session not found");
    }

    console.log('✅ Found payment session:', {
      _id: paymentSession._id,
      status: paymentSession.status,
      amount: paymentSession.amount,
      donationType: paymentSession.donationType,
      targetId: paymentSession.targetId,
    });

    // Check if already completed
    if (paymentSession.status === "completed") {
      console.log("⚠️ Already completed, checking for existing donation");
      
      const allDonations = await ctx.db.query("donations").collect();
      const existingDonation = allDonations.find(
        d => d.stripePaymentSessionId === paymentSession._id
      );
      
      if (existingDonation) {
        console.log('✅ Found existing donation:', existingDonation._id);
        return { donationId: existingDonation._id, alreadyCompleted: true };
      }
      
      // If no donation found but session is completed, create it now
      console.log('⚠️ Session completed but no donation found, creating now...');
    }

    // Update payment session status
    await ctx.db.patch(paymentSession._id, {
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
      stripeCustomerId: args.stripeCustomerId,
    });
    console.log('✅ Updated payment session status');

    // Get user
    const user = await ctx.db.get(paymentSession.userId);
    if (!user) {
      console.error('❌ User not found');
      throw new Error("User not found");
    }
    console.log('✅ Found user:', user.email);

    // Get donor
    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!donor) {
      console.error('❌ Donor not found');
      throw new Error("Donor not found");
    }
    console.log('✅ Found donor:', donor._id);

    // Determine NGO and Campaign IDs
    let ngoId: Id<"ngos"> | undefined = undefined;
    let campaignId: Id<"fundraisingCampaigns"> | undefined = undefined;

    if (paymentSession.donationType === "ngo") {
      ngoId = paymentSession.targetId as Id<"ngos">;
      console.log('✅ Direct NGO donation:', ngoId);
    } else if (paymentSession.donationType === "campaign") {
      campaignId = paymentSession.targetId as Id<"fundraisingCampaigns">;
      const campaign = await ctx.db.get(campaignId);
      if (campaign) {
        ngoId = campaign.ngoId;
        console.log('✅ Campaign donation:', { campaignId, ngoId });
      }
    }

    // CRITICAL: Ensure ngoId is set
    if (!ngoId) {
      console.error('❌ CRITICAL: ngoId is undefined!', {
        donationType: paymentSession.donationType,
        targetId: paymentSession.targetId,
      });
      throw new Error("Failed to determine NGO ID");
    }

    // Create donation record - EXACTLY matching schema
    const donationData = {
      donorId: donor._id,
      ngoId: ngoId,  // Now guaranteed to be set
      campaignId: campaignId,
      donationType: (paymentSession.donationItemType || "money") as "money" | "books" | "clothes" | "food" | "medical_supplies",
      amount: (paymentSession.donationItemType === "money" || !paymentSession.donationItemType)
        ? paymentSession.amount
        : undefined,
      quantity: undefined,  // Only for physical donations
      unit: undefined,      // Only for physical donations
      description: undefined, // Only for physical donations
      donationDate: Date.now(),
      pickupScheduled: undefined, // Only for physical donations
      pickupDate: undefined,      // Only for physical donations
      pickupAddress: undefined,   // Only for physical donations
      status: "completed" as const,
      paymentId: args.stripePaymentIntentId,
      taxReceiptGenerated: false,
      taxReceiptUrl: undefined,
      createdAt: Date.now(),
      stripePaymentSessionId: paymentSession._id,
      stripePaymentIntentId: args.stripePaymentIntentId,
      receiptId: undefined,
    };

    console.log('🔵 Creating donation with data:', JSON.stringify(donationData, null, 2));

    const donationId = await ctx.db.insert("donations", donationData);

    console.log('✅✅✅ DONATION CREATED SUCCESSFULLY:', donationId);

    // Verify it was saved
    const savedDonation = await ctx.db.get(donationId);
    console.log('✅ Verified donation in DB:', {
      _id: savedDonation?._id,
      donationType: savedDonation?.donationType,
      amount: savedDonation?.amount,
      ngoId: savedDonation?.ngoId,
      status: savedDonation?.status,
    });

    // Update NGO stats
    if (ngoId) {
      const ngo = await ctx.db.get(ngoId);
      if (ngo) {
        await ctx.db.patch(ngoId, {
          totalDonationsReceived: (ngo.totalDonationsReceived || 0) + 1,
          totalAmountRaised: (ngo.totalAmountRaised || 0) + 
            (paymentSession.donationItemType === "money" || !paymentSession.donationItemType
              ? paymentSession.amount
              : 0),
        });
        console.log('✅ Updated NGO stats');
      }
    }

    // Update campaign stats
    if (campaignId) {
      const campaign = await ctx.db.get(campaignId);
      if (campaign) {
        await ctx.db.patch(campaignId, {
          raisedAmount: campaign.raisedAmount + paymentSession.amount,
          totalDonors: (campaign.totalDonors || 0) + 1,
        });
        console.log('✅ Updated campaign stats');
      }
    }

    // Schedule receipt generation
    await ctx.scheduler.runAfter(0, api.receipt.generateReceipt, {
      donationId,
      userId: user._id,
    });
    console.log('✅ Scheduled receipt generation');

    console.log('🎉🎉🎉 COMPLETE - Donation ID:', donationId);

    return { donationId, alreadyCompleted: false };
  },
});
// Create subscription
export const createSubscription = mutation({
    args: {
        clerkUserId: v.string(),
        targetType: v.union(v.literal("ngo"), v.literal("campaign")),
        targetId: v.string(),
        stripeSubscriptionId: v.string(),
        stripeCustomerId: v.string(),
        stripePriceId: v.string(),
        amount: v.number(),
        currency: v.string(),
        interval: v.union(v.literal("monthly"), v.literal("yearly")),
        currentPeriodStart: v.number(),
        currentPeriodEnd: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkUserId))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        const subscriptionId = await ctx.db.insert("stripeSubscriptions", {
            userId: user._id,
            donationType: args.targetType,
            targetId: args.targetId as Id<"ngos"> | Id<"fundraisingCampaigns">,

            stripeSubscriptionId: args.stripeSubscriptionId,
            stripeCustomerId: args.stripeCustomerId,
            stripePriceId: args.stripePriceId,
            amount: args.amount,
            currency: args.currency,
            interval: args.interval,
            status: "active",
            currentPeriodStart: args.currentPeriodStart,
            currentPeriodEnd: args.currentPeriodEnd,
            cancelAtPeriodEnd: false,
            createdAt: Date.now(),
        });

        return subscriptionId;
    },
});

// Get user's donation history
export const getMyDonationHistory = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        const donor = await ctx.db
            .query("donors")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .unique();

        if (!donor) return [];

        const donations = await ctx.db
            .query("donations")
            .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
            .order("desc")
            .collect();

        // Enrich with NGO/Campaign details
        const enrichedDonations = await Promise.all(
            donations.map(async (donation) => {
                let targetDetails = null;

                if (donation.ngoId) {
                    const ngo = await ctx.db.get(donation.ngoId);
                    if (ngo) {
                        const ngoUser = await ctx.db.get(ngo.userId);
                        targetDetails = {
                            type: "ngo" as const,
                            name: ngo.organizationName,
                            city: ngoUser?.city,
                        };
                    }
                } else if (donation.campaignId) {
                    const campaign = await ctx.db.get(donation.campaignId);
                    if (campaign) {
                        const ngo = await ctx.db.get(campaign.ngoId);
                        targetDetails = {
                            type: "campaign" as const,
                            name: campaign.title,
                            ngoName: ngo?.organizationName,
                        };
                    }
                }

                const receipt = donation.receiptId
                    ? await ctx.db.get(donation.receiptId)
                    : null;

                return {
                    ...donation,
                    targetDetails,
                    receipt,
                };
            })
        );

        return enrichedDonations;
    },
});

// Get user's active subscriptions
export const getMySubscriptions = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        const subscriptions = await ctx.db
            .query("stripeSubscriptions")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        // Enrich with target details
        const enrichedSubscriptions = await Promise.all(
            subscriptions.map(async (subscription) => {
                let targetDetails = null;

                if (subscription.donationType === "ngo") {
                    const ngo = await ctx.db.get(subscription.targetId as Id<"ngos">);
                    if (ngo) {
                        targetDetails = {
                            name: ngo.organizationName,
                            verified: ngo.verified,
                        };
                    }
                } else {
                    const campaign = await ctx.db.get(subscription.targetId as Id<"fundraisingCampaigns">);
                    if (campaign) {
                        const ngo = await ctx.db.get(campaign.ngoId);
                        targetDetails = {
                            name: campaign.title,
                            ngoName: ngo?.organizationName,
                        };
                    }
                }

                return {
                    ...subscription,
                    targetDetails,
                };
            })
        );

        return enrichedSubscriptions;
    },
});

// Cancel subscription
export const cancelSubscription = mutation({
    args: {
        subscriptionId: v.id("stripeSubscriptions"),
    },
    handler: async (ctx, args) => {
        const subscription = await ctx.db.get(args.subscriptionId);

        if (!subscription) {
            throw new Error("Subscription not found");
        }

        // Verify ownership
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== subscription.userId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.subscriptionId, {
            cancelAtPeriodEnd: true,
            updatedAt: Date.now(),
        });

        return true;
    },
});

// Log webhook event
export const logWebhookEvent = mutation({
    args: {
        eventId: v.string(),
        type: v.string(),
        data: v.any(),
    },
    handler: async (ctx, args) => {
        // Check if event already processed
        const existing = await ctx.db
            .query("stripeWebhookEvents")
            .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
            .unique();

        if (existing) {
            return { processed: true, eventId: existing._id };
        }

        const eventId = await ctx.db.insert("stripeWebhookEvents", {
            eventId: args.eventId,
            type: args.type,
            data: args.data,
            processed: true,
            createdAt: Date.now(),
        });

        return { processed: false, eventId };
    },
});
// Add this to convex/payments.ts
// Change from internalMutation to regular mutation

export const migratePaymentsToDonations = mutation({
  handler: async (ctx) => {
    console.log('🔄 Starting migration of payments to donations...');

    // Get all payment sessions
    const allPaymentSessions = await ctx.db
      .query("stripePaymentSessions")
      .collect();

    console.log(`📊 Found ${allPaymentSessions.length} payment sessions`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const paymentSession of allPaymentSessions) {
      try {
        console.log(`\n🔍 Processing session: ${paymentSession._id}`);

        // Check if donation already exists for this session
        const allDonations = await ctx.db.query("donations").collect();
        const existingDonation = allDonations.find(
          d => d.stripePaymentSessionId === paymentSession._id
        );

        if (existingDonation) {
          console.log(`⏭️  Skipping - donation already exists: ${existingDonation._id}`);
          skipCount++;
          continue;
        }

        // Get user
        const user = await ctx.db.get(paymentSession.userId);
        if (!user) {
          console.error(`❌ User not found for session ${paymentSession._id}`);
          errorCount++;
          continue;
        }

        // Get donor
        const donor = await ctx.db
          .query("donors")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .unique();

        if (!donor) {
          console.error(`❌ Donor not found for user ${user._id}`);
          errorCount++;
          continue;
        }

        // Determine NGO and Campaign IDs
        let ngoId: Id<"ngos"> | undefined = undefined;
        let campaignId: Id<"fundraisingCampaigns"> | undefined = undefined;

        if (paymentSession.donationType === "ngo") {
          ngoId = paymentSession.targetId as Id<"ngos">;
          
          // Verify NGO exists
          const ngo = await ctx.db.get(ngoId);
          if (!ngo) {
            console.error(`❌ NGO not found: ${ngoId}`);
            errorCount++;
            continue;
          }
          console.log(`✅ NGO: ${ngo.organizationName}`);
          
        } else if (paymentSession.donationType === "campaign") {
          campaignId = paymentSession.targetId as Id<"fundraisingCampaigns">;
          
          const campaign = await ctx.db.get(campaignId);
          if (!campaign) {
            console.error(`❌ Campaign not found: ${campaignId}`);
            errorCount++;
            continue;
          }
          
          ngoId = campaign.ngoId;
          console.log(`✅ Campaign: ${campaign.title} -> NGO: ${ngoId}`);
        }

        if (!ngoId) {
          console.error(`❌ Could not determine NGO ID`);
          errorCount++;
          continue;
        }

        // Create donation
        const donationData = {
          donorId: donor._id,
          ngoId: ngoId,
          campaignId: campaignId,
          donationType: (paymentSession.donationItemType || "money") as "money" | "books" | "clothes" | "food" | "medical_supplies",
          amount: (paymentSession.donationItemType === "money" || !paymentSession.donationItemType)
            ? paymentSession.amount
            : undefined,
          quantity: undefined,
          unit: undefined,
          description: undefined,
          donationDate: paymentSession.createdAt,
          pickupScheduled: undefined,
          pickupDate: undefined,
          pickupAddress: undefined,
          status: "completed" as const,
          paymentId: paymentSession.stripeSessionId,
          taxReceiptGenerated: false,
          taxReceiptUrl: undefined,
          createdAt: paymentSession.createdAt,
          stripePaymentSessionId: paymentSession._id,
          stripePaymentIntentId: undefined,
          receiptId: undefined,
        };

        const donationId = await ctx.db.insert("donations", donationData);
        console.log(`✅ Created donation: ${donationId}`);

        // Update NGO stats
        const ngo = await ctx.db.get(ngoId);
        if (ngo) {
          await ctx.db.patch(ngoId, {
            totalDonationsReceived: (ngo.totalDonationsReceived || 0) + 1,
            totalAmountRaised: (ngo.totalAmountRaised || 0) + 
              (paymentSession.donationItemType === "money" || !paymentSession.donationItemType
                ? paymentSession.amount
                : 0),
          });
          console.log(`✅ Updated NGO stats`);
        }

        // Update campaign stats if applicable
        if (campaignId) {
          const campaign = await ctx.db.get(campaignId);
          if (campaign) {
            await ctx.db.patch(campaignId, {
              raisedAmount: campaign.raisedAmount + paymentSession.amount,
              totalDonors: (campaign.totalDonors || 0) + 1,
            });
            console.log(`✅ Updated campaign stats`);
          }
        }

        // Mark payment session as completed if not already
        if (paymentSession.status !== "completed") {
          await ctx.db.patch(paymentSession._id, {
            status: "completed",
            completedAt: Date.now(),
            updatedAt: Date.now(),
          });
        }

        successCount++;

      } catch (error) {
        console.error(`❌ Error processing session ${paymentSession._id}:`, error);
        errorCount++;
      }
    }

    const summary = {
      total: allPaymentSessions.length,
      success: successCount,
      skipped: skipCount,
      errors: errorCount,
    };

    console.log('\n🎉 Migration Complete!');
    console.log('📊 Summary:', summary);

    return summary;
  },
});

// Get all monetary donations from payment sessions (for admin/analytics)
export const getAllMonetaryDonations = query({
  handler: async (ctx) => {
    const paymentSessions = await ctx.db
      .query("stripePaymentSessions")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .collect();

    // Enrich with donor, NGO, and campaign details
    const enrichedDonations = await Promise.all(
      paymentSessions.map(async (session) => {
        const donorUser = await ctx.db.get(session.userId);
        
        let ngo = null;
        let campaign = null;
        
        if (session.donationType === "ngo") {
          ngo = await ctx.db.get(session.targetId as Id<"ngos">);
        } else if (session.donationType === "campaign") {
          campaign = await ctx.db.get(session.targetId as Id<"fundraisingCampaigns">);
          if (campaign) {
            ngo = await ctx.db.get(campaign.ngoId);
          }
        }

        const ngoUser = ngo ? await ctx.db.get(ngo.userId) : null;

        return {
          _id: session._id,
          donorId: session.userId,
          ngoId: ngo?._id,
          campaignId: campaign?._id,
          donationType: "money" as const,
          amount: session.amount,
          donationDate: session.completedAt || session.createdAt,
          status: "completed" as const,
          createdAt: session.createdAt,
          donorDetails: {
            name: donorUser?.name,
            email: donorUser?.email,
          },
          ngoDetails: ngo ? {
            name: ngo.organizationName,
            city: ngoUser?.city,
            verified: ngo.verified,
          } : null,
          campaignDetails: campaign ? {
            title: campaign.title,
            status: campaign.status,
          } : null,
        };
      })
    );

    return enrichedDonations;
  },
});

// Get monetary donations for a specific NGO from payment sessions
export const getNGOMonetaryDonations = query({
  args: {
    ngoId: v.id("ngos"),
  },
  handler: async (ctx, args) => {
    const allPaymentSessions = await ctx.db
      .query("stripePaymentSessions")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .collect();

    // Filter for this NGO's payments
    const ngoPayments = await Promise.all(
      allPaymentSessions.map(async (session) => {
        let isForThisNGO = false;
        let campaignDetails = null;

        if (session.donationType === "ngo" && session.targetId === args.ngoId) {
          isForThisNGO = true;
        } else if (session.donationType === "campaign") {
          const campaign = await ctx.db.get(session.targetId as Id<"fundraisingCampaigns">);
          if (campaign && campaign.ngoId === args.ngoId) {
            isForThisNGO = true;
            campaignDetails = {
              title: campaign.title,
              status: campaign.status,
            };
          }
        }

        if (!isForThisNGO) return null;

        const donorUser = await ctx.db.get(session.userId);

        return {
          _id: session._id,
          donorId: session.userId,
          ngoId: args.ngoId,
          campaignId: session.donationType === "campaign" ? session.targetId as Id<"fundraisingCampaigns"> : undefined,
          donationType: "money" as const,
          amount: session.amount,
          quantity: undefined,
          unit: undefined,
          donationDate: session.completedAt || session.createdAt,
          status: "completed" as const,
          paymentId: session.stripeSessionId,
          createdAt: session.createdAt,
          donorUser: donorUser ? {
            name: donorUser.name,
            email: donorUser.email,
          } : null,
          donorDetails: {
            name: donorUser?.name,
            email: donorUser?.email,
          },
          campaignDetails,
        };
      })
    );

    return ngoPayments.filter((payment): payment is NonNullable<typeof payment> => payment !== null);
  },
});

// Get monetary donations for the currently logged-in NGO from payment sessions
export const getMyNGOMonetaryDonations = query({
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

    console.log('🔍 Fetching monetary donations from payment sessions for NGO:', {
      ngoId: ngo._id,
      ngoName: ngo.organizationName,
    });

    const allPaymentSessions = await ctx.db
      .query("stripePaymentSessions")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .collect();

    console.log('📊 Total completed payment sessions:', allPaymentSessions.length);

    const ngoPayments = await Promise.all(
      allPaymentSessions.map(async (session) => {
        let isForThisNGO = false;
        let campaignDetails = null;

        if (session.donationType === "ngo" && session.targetId === ngo._id) {
          isForThisNGO = true;
        } else if (session.donationType === "campaign") {
          const campaign = await ctx.db.get(session.targetId as Id<"fundraisingCampaigns">);
          if (campaign && campaign.ngoId === ngo._id) {
            isForThisNGO = true;
            campaignDetails = {
              title: campaign.title,
              status: campaign.status,
            };
          }
        }

        if (!isForThisNGO) return null;

        const donorUser = await ctx.db.get(session.userId);

        return {
          _id: session._id,
          donorId: session.userId,
          ngoId: ngo._id,
          campaignId: session.donationType === "campaign" ? session.targetId as Id<"fundraisingCampaigns"> : undefined,
          donationType: "money" as const,
          amount: session.amount,
          quantity: undefined,
          unit: undefined,
          donationDate: session.completedAt || session.createdAt,
          status: "completed" as const,
          paymentId: session.stripeSessionId,
          createdAt: session.createdAt,
          donorUser: donorUser ? {
            name: donorUser.name,
            email: donorUser.email,
          } : null,
          donorDetails: {
            name: donorUser?.name,
            email: donorUser?.email,
          },
          campaignDetails,
        };
      })
    );

    const result = ngoPayments.filter((payment): payment is NonNullable<typeof payment> => payment !== null);
    console.log('💰 Found monetary donations for this NGO:', result.length);
    
    return result;
  },
});

// Get monetary donations for a specific campaign from payment sessions
export const getCampaignMonetaryDonations = query({
  args: {
    campaignId: v.id("fundraisingCampaigns"),
  },
  handler: async (ctx, args) => {
    const allPaymentSessions = await ctx.db
      .query("stripePaymentSessions")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .collect();

    // Filter for this campaign's payments
    const campaignPayments = await Promise.all(
      allPaymentSessions.map(async (session) => {
        if (session.donationType !== "campaign" || session.targetId !== args.campaignId) {
          return null;
        }

        const donorUser = await ctx.db.get(session.userId);

        return {
          _id: session._id,
          donorId: session.userId,
          campaignId: args.campaignId,
          donationType: "money" as const,
          amount: session.amount,
          donationDate: session.completedAt || session.createdAt,
          status: "completed" as const,
          createdAt: session.createdAt,
          donorDetails: {
            name: donorUser?.name,
            email: donorUser?.email,
          },
        };
      })
    );

    return campaignPayments.filter((payment): payment is NonNullable<typeof payment> => payment !== null);
  },
});

// Get monetary donation statistics from payment sessions
export const getMonetaryDonationStats = query({
  handler: async (ctx) => {
    const paymentSessions = await ctx.db
      .query("stripePaymentSessions")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const totalAmount = paymentSessions.reduce(
      (sum, session) => sum + session.amount, 
      0
    );

    return {
      totalDonations: paymentSessions.length,
      totalAmount,
      completedDonations: paymentSessions.length,
      totalCompleted: totalAmount,
      pendingDonations: 0, // Payment sessions are only stored when completed
      averageDonation: paymentSessions.length > 0 ? totalAmount / paymentSessions.length : 0,
    };
  },
});

// Get user's monetary donations from payment sessions (for donor's personal view)
export const getMyMonetaryDonations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const paymentSessions = await ctx.db
      .query("stripePaymentSessions")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("status"), "completed")
        )
      )
      .order("desc")
      .collect();

    // Enrich with NGO and campaign details
    const enrichedDonations = await Promise.all(
      paymentSessions.map(async (session) => {
        let ngo = null;
        let campaign = null;

        if (session.donationType === "ngo") {
          ngo = await ctx.db.get(session.targetId as Id<"ngos">);
        } else if (session.donationType === "campaign") {
          campaign = await ctx.db.get(session.targetId as Id<"fundraisingCampaigns">);
          if (campaign) {
            ngo = await ctx.db.get(campaign.ngoId);
          }
        }

        return {
          _id: session._id,
          donorId: user._id,
          ngoId: ngo?._id,
          campaignId: campaign?._id,
          donationType: "money" as const,
          amount: session.amount,
          donationDate: session.completedAt || session.createdAt,
          status: "completed" as const,
          createdAt: session.createdAt,
          ngoDetails: ngo ? {
            name: ngo.organizationName,
            verified: ngo.verified,
          } : null,
          campaignDetails: campaign ? {
            title: campaign.title,
            status: campaign.status,
          } : null,
        };
      })
    );

    return enrichedDonations;
  },
});