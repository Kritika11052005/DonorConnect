import { query } from "./_generated/server";

// Get comprehensive dashboard statistics for the current donor
export const getDashboardStats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        livesImpacted: 0,
        donationsMade: 0,
        impactScore: 0,
        breakdown: {
          bloodDonations: 0,
          volunteerHours: 0,
          organPledges: 0,
          physicalDonations: 0,
        }
      };
    }

    // Get the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return {
        livesImpacted: 0,
        donationsMade: 0,
        impactScore: 0,
        breakdown: {
          bloodDonations: 0,
          volunteerHours: 0,
          organPledges: 0,
          physicalDonations: 0,
        }
      };
    }

    // Get donor record
    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!donor) {
      return {
        livesImpacted: 0,
        donationsMade: 0,
        impactScore: 0,
        breakdown: {
          bloodDonations: 0,
          volunteerHours: 0,
          organPledges: 0,
          physicalDonations: 0,
        }
      };
    }

    // 1. Get completed blood donation appointments
    const completedBloodDonations = await ctx.db
      .query("bloodDonationAppointments")
      .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const bloodDonationCount = completedBloodDonations.length;

    // 2. Get active organ pledges
    const activePledges = await ctx.db
      .query("organDonationRegistry")
      .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const organPledgeCount = activePledges.length;
    const totalOrgansPledged = activePledges.reduce(
      (sum, pledge) => sum + pledge.organs.length,
      0
    );

    // 3. Get volunteer registrations and calculate total hours
    const volunteers = await ctx.db
      .query("volunteers")
      .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
      .collect();

    const totalVolunteerHours = volunteers.reduce(
      (sum, vol) => sum + (vol.hoursContributed || 0),
      0
    );
    const volunteerCount = volunteers.filter(
      (v) => v.status === "active" || v.status === "completed"
    ).length;

    // 4. Get physical donations (money, clothes, books, etc.)
    const physicalDonations = await ctx.db
      .query("donations")
      .withIndex("by_donorId", (q) => q.eq("donorId", donor._id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const physicalDonationCount = physicalDonations.length;

    // CALCULATIONS

    // Lives Impacted = (Blood donations × 3) + (Organs pledged × 8)
    // Each blood donation can save up to 3 lives
    // Each organ can save/improve up to 8 lives on average
    const livesImpacted = (bloodDonationCount * 3) + (totalOrgansPledged * 8);

    // Donations Made = Total count of all donation activities
    const donationsMade = 
      bloodDonationCount + 
      volunteerCount + 
      organPledgeCount + 
      physicalDonationCount;

    // Impact Score = Weighted score of all activities
    // Blood donations: 5 points each
    // Volunteer hours: 1 point per hour
    // Organ pledge: 20 points per organ
    // Physical donations: 2 points each
    const impactScore = 
      (bloodDonationCount * 5) + 
      (totalVolunteerHours * 1) + 
      (totalOrgansPledged * 20) + 
      (physicalDonationCount * 2);

    return {
      livesImpacted,
      donationsMade,
      impactScore,
      breakdown: {
        bloodDonations: bloodDonationCount,
        volunteerHours: totalVolunteerHours,
        organPledges: totalOrgansPledged,
        physicalDonations: physicalDonationCount,
      }
    };
  },
});