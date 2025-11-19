// convex/search.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

// Search and filter hospitals
export const searchHospitals = query({
  args: {
    searchQuery: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("popular"), 
      v.literal("rating"), 
      v.literal("recent"),
      v.literal("name")
    )),
    city: v.optional(v.string()),
    hospitalType: v.optional(v.union(v.literal("government"), v.literal("private"), v.literal("trust"))),
    minRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hospitals = await ctx.db
      .query("hospitals")
      .withIndex("by_verified", (q) => q.eq("verified", true))
      .collect();

    // Join with user data
    const hospitalsWithDetails = await Promise.all(
      hospitals.map(async (hospital) => {
        const user = await ctx.db.get(hospital.userId);
        return {
          ...hospital,
          user,
        };
      })
    );

    // Apply filters
    let filtered = hospitalsWithDetails;

    // Search filter
    if (args.searchQuery && args.searchQuery.trim() !== "") {
      const query = args.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.hospitalName.toLowerCase().includes(query) ||
          h.description.toLowerCase().includes(query) ||
          h.user?.city?.toLowerCase().includes(query) ||
          h.user?.state?.toLowerCase().includes(query) ||
          h.specializations.some((s) => s.toLowerCase().includes(query))
      );
    }

    // City filter
    if (args.city) {
      filtered = filtered.filter((h) => h.user?.city === args.city);
    }

    // Hospital type filter
    if (args.hospitalType) {
      filtered = filtered.filter((h) => h.hospitalType === args.hospitalType);
    }

    // Rating filter
    if (args.minRating !== undefined) {
      filtered = filtered.filter(
        (h) => (h.averageRating || 0) >= args.minRating!
      );
    }

    // Sort
    switch (args.sortBy) {
      case "popular":
        filtered.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
        break;
      case "rating":
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case "recent":
        filtered.sort((a, b) => (b.user?.createdAt || 0) - (a.user?.createdAt || 0));
        break;
      case "name":
        filtered.sort((a, b) => a.hospitalName.localeCompare(b.hospitalName));
        break;
      default:
        filtered.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
    }

    return {
      results: filtered,
      count: filtered.length,
    };
  },
});

// Search and filter NGOs
export const searchNGOs = query({
  args: {
    searchQuery: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("popular"), 
      v.literal("rating"), 
      v.literal("recent"),
      v.literal("name")
    )),
    category: v.optional(v.string()),
    city: v.optional(v.string()),
    minRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const ngos = await ctx.db
      .query("ngos")
      .withIndex("by_verified", (q) => q.eq("verified", true))
      .collect();

    // Join with user data
    const ngosWithDetails = await Promise.all(
      ngos.map(async (ngo) => {
        const user = await ctx.db.get(ngo.userId);
        return {
          ...ngo,
          user,
        };
      })
    );

    // Apply filters
    let filtered = ngosWithDetails;

    // Search filter
    if (args.searchQuery && args.searchQuery.trim() !== "") {
      const query = args.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.organizationName.toLowerCase().includes(query) ||
          n.description.toLowerCase().includes(query) ||
          n.user?.city?.toLowerCase().includes(query) ||
          n.user?.state?.toLowerCase().includes(query) ||
          n.categories.some((c) => c.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (args.category) {
      filtered = filtered.filter((n) =>
        n.categories.some((c) => c.toLowerCase() === args.category!.toLowerCase())
      );
    }

    // City filter
    if (args.city) {
      filtered = filtered.filter((n) => n.user?.city === args.city);
    }

    // Rating filter
    if (args.minRating !== undefined) {
      filtered = filtered.filter(
        (n) => (n.averageRating || 0) >= args.minRating!
      );
    }

    // Sort
    switch (args.sortBy) {
      case "popular":
        filtered.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
        break;
      case "rating":
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case "recent":
        filtered.sort((a, b) => (b.user?.createdAt || 0) - (a.user?.createdAt || 0));
        break;
      case "name":
        filtered.sort((a, b) => a.organizationName.localeCompare(b.organizationName));
        break;
      default:
        filtered.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
    }

    return {
      results: filtered,
      count: filtered.length,
    };
  },
});

// Search and filter campaigns - NOW ONLY SHOWS CAMPAIGNS FROM VERIFIED NGOs
export const searchCampaigns = query({
  args: {
    searchQuery: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("all"))),
    sortBy: v.optional(v.union(
      v.literal("popular"), 
      v.literal("rating"), 
      v.literal("recent"),
      v.literal("ending_soon"),
      v.literal("amount_raised")
    )),
    category: v.optional(v.string()),
    minRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let campaigns = await ctx.db.query("fundraisingCampaigns").collect();

    // Status filter
    if (args.status && args.status !== "all") {
      campaigns = campaigns.filter((c) => c.status === args.status);
    }

    // Join with NGO data and filter by verified NGOs
    const campaignsWithDetails = await Promise.all(
      campaigns.map(async (campaign) => {
        const ngo = await ctx.db.get(campaign.ngoId);
        const ngoUser = ngo ? await ctx.db.get(ngo.userId) : null;
        return {
          ...campaign,
          ngo: ngo ? { ...ngo, user: ngoUser } : null,
        };
      })
    );

    // CRITICAL: Filter to only show campaigns from verified NGOs
    let filtered = campaignsWithDetails.filter(
      (c) => c.ngo !== null && c.ngo.verified === true
    );

    // Search filter
    if (args.searchQuery && args.searchQuery.trim() !== "") {
      const query = args.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query) ||
          c.ngo?.organizationName.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (args.category) {
      filtered = filtered.filter(
        (c) => c.category.toLowerCase() === args.category!.toLowerCase()
      );
    }

    // Rating filter
    if (args.minRating !== undefined) {
      filtered = filtered.filter(
        (c) => (c.averageRating || 0) >= args.minRating!
      );
    }

    // Sort
    switch (args.sortBy) {
      case "popular":
        filtered.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
        break;
      case "rating":
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case "recent":
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "ending_soon":
        filtered = filtered.filter((c) => c.endDate !== undefined);
        filtered.sort((a, b) => (a.endDate || 0) - (b.endDate || 0));
        break;
      case "amount_raised":
        filtered.sort((a, b) => b.raisedAmount - a.raisedAmount);
        break;
      default:
        filtered.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
    }

    return {
      results: filtered,
      count: filtered.length,
    };
  },
});

// Get popular causes (categories) with counts
// Replace the getPopularCauses query in convex/search.ts with this:

export const getPopularCauses = query({
  handler: async (ctx) => {
    // Get only verified NGOs
    const ngos = await ctx.db
      .query("ngos")
      .withIndex("by_verified", (q) => q.eq("verified", true))
      .collect();
    
    const campaigns = await ctx.db
      .query("fundraisingCampaigns")
      .collect();

    // Filter campaigns to only include those from verified NGOs
    const verifiedCampaigns = await Promise.all(
      campaigns.map(async (campaign) => {
        const ngo = await ctx.db.get(campaign.ngoId);
        return ngo?.verified ? campaign : null;
      })
    );

    // Remove null entries (campaigns from unverified NGOs)
    const filteredCampaigns = verifiedCampaigns.filter(
      (c): c is NonNullable<typeof c> => c !== null
    );

    const categoryCount: Record<string, number> = {};

    // Count from verified NGOs only
    ngos.forEach((ngo) => {
      ngo.categories.forEach((cat) => {
        const normalized = cat.toLowerCase();
        categoryCount[normalized] = (categoryCount[normalized] || 0) + 1;
      });
    });

    // Count from campaigns of verified NGOs only
    filteredCampaigns.forEach((campaign) => {
      const normalized = campaign.category.toLowerCase();
      categoryCount[normalized] = (categoryCount[normalized] || 0) + 1;
    });

    // Convert to array and sort by count
    const causes = Object.entries(categoryCount)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return causes;
  },
});

// Get available cities
export const getAvailableCities = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    const cities = new Set<string>();
    users.forEach((user) => {
      if (user.city) cities.add(user.city);
    });

    return Array.from(cities).sort();
  },
});