// Get all blood donation appointments for the current hospital
export const getHospitalBloodDonations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital) return [];

    const appointments = await ctx.db
      .query("bloodDonationAppointments")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", hospital._id))
      .collect();

    return appointments;
  },
});
import { mutation, query } from "./_generated/server";
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
          averageRating: hospital.averageRating,
          totalRatings: hospital.totalRatings,
        };
      })
    );

    return hospitalsWithDetails;
  },
});

// Get current hospital profile
export const getCurrentHospital = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "hospital") {
      return null;
    }

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    return hospital ? { ...hospital, user } : null;
  },
});

// Create hospital profile
export const createHospitalProfile = mutation({
  args: {
    hospitalName: v.string(),
    description: v.string(),
    registrationNumber: v.string(),
    hospitalType: v.union(v.literal("government"), v.literal("private"), v.literal("trust")),
    totalBeds: v.optional(v.number()),
    specializations: v.array(v.string()),
    phoneNumber: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    pincode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email ?? "",
        name: args.hospitalName,
        role: "hospital",
        phoneNumber: args.phoneNumber,
        address: args.address,
        city: args.city,
        state: args.state,
        pincode: args.pincode,
        createdAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    } else {
      await ctx.db.patch(user._id, {
        name: args.hospitalName,
        phoneNumber: args.phoneNumber,
        address: args.address,
        city: args.city,
        state: args.state,
        pincode: args.pincode,
      });
    }

    if (!user) {
      throw new Error("Failed to create user");
    }

    const existingHospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (existingHospital) {
      throw new Error("Hospital profile already exists");
    }

    const hospitalId = await ctx.db.insert("hospitals", {
      userId: user._id,
      hospitalName: args.hospitalName,
      description: args.description,
      registrationNumber: args.registrationNumber,
      hospitalType: args.hospitalType,
      totalBeds: args.totalBeds,
      verified: false,
      specializations: args.specializations,
      averageRating: 0,
      totalRatings: 0,
      totalBloodDonations: 0,
      totalOrganTransplants: 0,
      popularityScore: 0,
    });

    return hospitalId;
  },
});

// Update hospital profile
export const updateHospitalProfile = mutation({
  args: {
    hospitalId: v.id("hospitals"),
    hospitalName: v.optional(v.string()),
    description: v.optional(v.string()),
    hospitalType: v.optional(v.union(v.literal("government"), v.literal("private"), v.literal("trust"))),
    totalBeds: v.optional(v.number()),
    specializations: v.optional(v.array(v.string())),
    phoneNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    pincode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const hospital = await ctx.db.get(args.hospitalId);
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || hospital.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const hospitalUpdate: any = {};
    if (args.hospitalName) hospitalUpdate.hospitalName = args.hospitalName;
    if (args.description) hospitalUpdate.description = args.description;
    if (args.hospitalType) hospitalUpdate.hospitalType = args.hospitalType;
    if (args.totalBeds !== undefined) hospitalUpdate.totalBeds = args.totalBeds;
    if (args.specializations) hospitalUpdate.specializations = args.specializations;

    await ctx.db.patch(args.hospitalId, hospitalUpdate);

    const userUpdate: any = {};
    if (args.hospitalName) userUpdate.name = args.hospitalName;
    if (args.phoneNumber) userUpdate.phoneNumber = args.phoneNumber;
    if (args.address) userUpdate.address = args.address;
    if (args.city) userUpdate.city = args.city;
    if (args.state) userUpdate.state = args.state;
    if (args.pincode) userUpdate.pincode = args.pincode;

    if (Object.keys(userUpdate).length > 0) {
      await ctx.db.patch(user._id, userUpdate);
    }

    return args.hospitalId;
  },
});

// Get hospital's available organs
export const getHospitalOrganAvailability = query({
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

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital) {
      return [];
    }

    const organs = await ctx.db
      .query("hospitalOrganAvailability")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", hospital._id))
      .filter((q) => q.eq(q.field("status"), "available"))
      .collect();

    return organs;
  },
});

// Get completed blood donations count
export const getCompletedBloodDonationsCount = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return 0;
    }

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital) {
      return 0;
    }

    const appointments = await ctx.db
      .query("bloodDonationAppointments")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", hospital._id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    return appointments.length;
  },
});

// Get incoming organ requests (requests made TO this hospital)
export const getIncomingOrganRequests = query({
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

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital) {
      return [];
    }

    // Get available organs at this hospital
    const availableOrgans = await ctx.db
      .query("hospitalOrganAvailability")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", hospital._id))
      .filter((q) => q.eq(q.field("status"), "available"))
      .collect();

    // For each available organ, find matching requests from other hospitals
    const allRequests = await ctx.db
      .query("organTransplantRequests")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    const matchingRequests = await Promise.all(
      allRequests
        .filter((request) => request.hospitalId !== hospital._id)
        .filter((request) =>
          availableOrgans.some(
            (organ) =>
              organ.organType === request.organType &&
              organ.bloodGroup === request.patientBloodGroup
          )
        )
        .map(async (request) => {
          const requestingHospital = await ctx.db.get(request.hospitalId);
          const requestingUser = requestingHospital
            ? await ctx.db.get(requestingHospital.userId)
            : null;
          return {
            ...request,
            requestingHospital,
            requestingUser,
          };
        })
    );

    return matchingRequests;
  },
});



// Search hospitals with filters
export const searchHospitals = query({
  args: {
    searchTerm: v.optional(v.string()),
    city: v.optional(v.string()),
    sortBy: v.optional(v.union(v.literal("urgency"), v.literal("rating"), v.literal("name"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    let currentHospitalId = null;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (user) {
        const hospital = await ctx.db
          .query("hospitals")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .unique();
        
        if (hospital) {
          currentHospitalId = hospital._id;
        }
      }
    }

    const hospitals = await ctx.db
      .query("hospitals")
      .withIndex("by_verified", (q) => q.eq("verified", true))
      .collect();

    const hospitalsWithDetails = await Promise.all(
      hospitals
        .filter((h) => h._id !== currentHospitalId)
        .map(async (hospital) => {
          const user = await ctx.db.get(hospital.userId);
          
          const urgentRequests = await ctx.db
            .query("organTransplantRequests")
            .withIndex("by_hospitalId", (q) => q.eq("hospitalId", hospital._id))
            .filter((q) => 
              q.and(
                q.eq(q.field("status"), "open"),
                q.eq(q.field("urgency"), "critical")
              )
            )
            .collect();

          return {
            _id: hospital._id,
            hospitalName: hospital.hospitalName,
            description: hospital.description,
            city: user?.city || "",
            state: user?.state || "",
            address: user?.address || "",
            hospitalType: hospital.hospitalType,
            specializations: hospital.specializations,
            averageRating: hospital.averageRating || 0,
            totalRatings: hospital.totalRatings || 0,
            urgentRequestsCount: urgentRequests.length,
            urgentRequests,
          };
        })
    );

    let filtered = hospitalsWithDetails;

    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.hospitalName.toLowerCase().includes(term) ||
          h.city.toLowerCase().includes(term) ||
          h.state.toLowerCase().includes(term)
      );
    }

    if (args.city) {
      filtered = filtered.filter(
        (h) => h.city.toLowerCase() === args.city?.toLowerCase()
      );
    }

    if (args.sortBy === "urgency") {
      filtered.sort((a, b) => b.urgentRequestsCount - a.urgentRequestsCount);
    } else if (args.sortBy === "rating") {
      filtered.sort((a, b) => b.averageRating - a.averageRating);
    } else if (args.sortBy === "name") {
      filtered.sort((a, b) => a.hospitalName.localeCompare(b.hospitalName));
    }

    return filtered;
  },
});
// Add these new queries and update the mutation in your convex/hospitals.ts file

// Get outgoing organ requests (requests made BY this hospital)
export const getOutgoingOrganRequests = query({
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

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital) {
      return [];
    }

    const requests = await ctx.db
      .query("organTransplantRequests")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", hospital._id))
      .collect();

    return requests;
  },
});

// Get all hospitals except current one (for dropdown)
export const getOtherHospitals = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    let currentHospitalId = null;
    if (user) {
      const hospital = await ctx.db
        .query("hospitals")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      
      if (hospital) {
        currentHospitalId = hospital._id;
      }
    }

    const hospitals = await ctx.db
      .query("hospitals")
      .withIndex("by_verified", (q) => q.eq("verified", true))
      .collect();

    const hospitalsWithDetails = await Promise.all(
      hospitals
        .filter((h) => h._id !== currentHospitalId)
        .map(async (hospital) => {
          const user = await ctx.db.get(hospital.userId);
          return {
            _id: hospital._id,
            hospitalName: hospital.hospitalName,
            city: user?.city || "",
            state: user?.state || "",
            hospitalType: hospital.hospitalType,
          };
        })
    );

    return hospitalsWithDetails.sort((a, b) => 
      a.hospitalName.localeCompare(b.hospitalName)
    );
  },
});

// UPDATED: Create organ transplant request with optional target hospital
export const createOrganTransplantRequest = mutation({
  args: {
    organType: v.string(),
    patientBloodGroup: v.union(
      v.literal("A+"), v.literal("A-"),
      v.literal("B+"), v.literal("B-"),
      v.literal("AB+"), v.literal("AB-"),
      v.literal("O+"), v.literal("O-")
    ),
    urgency: v.union(v.literal("critical"), v.literal("urgent"), v.literal("normal")),
    patientAge: v.number(),
    additionalDetails: v.optional(v.string()),
    targetHospitalId: v.optional(v.id("hospitals")), // NEW: Optional target hospital
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

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital) {
      throw new Error("Hospital profile not found");
    }

    const requestId = await ctx.db.insert("organTransplantRequests", {
      hospitalId: hospital._id,
      organType: args.organType,
      patientBloodGroup: args.patientBloodGroup,
      urgency: args.urgency,
      patientAge: args.patientAge,
      additionalDetails: args.additionalDetails,
      targetHospitalId: args.targetHospitalId, // NEW: Store target hospital if specified
      status: "open",
      createdAt: Date.now(),
    });

    return requestId;
  },
});
export const getDetailedOrganAvailability = query({
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

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital) {
      return [];
    }

    const organs = await ctx.db
      .query("hospitalOrganAvailability")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", hospital._id))
      .collect();

    // Group by organ type and blood group
    const organMap = new Map();
    
    organs.forEach((organ) => {
      const key = `${organ.organType}-${organ.bloodGroup}`;
      if (!organMap.has(key)) {
        organMap.set(key, {
          organType: organ.organType,
          bloodGroup: organ.bloodGroup,
          available: 0,
          allocated: 0,
          transplanted: 0,
          expired: 0,
          records: []
        });
      }
      
      const group = organMap.get(key);
      const qty = organ.quantity || 1;
      
      if (organ.status === "available") group.available += qty;
      else if (organ.status === "allocated") group.allocated += qty;
      else if (organ.status === "transplanted") group.transplanted += qty;
      else if (organ.status === "expired") group.expired += qty;
      
      group.records.push(organ);
    });

    return Array.from(organMap.values());
  },
});

// Add new organ availability
export const addOrganAvailability = mutation({
  args: {
    organType: v.string(),
    bloodGroup: v.union(
      v.literal("A+"), v.literal("A-"),
      v.literal("B+"), v.literal("B-"),
      v.literal("AB+"), v.literal("AB-"),
      v.literal("O+"), v.literal("O-")
    ),
    quantity: v.number(),
    availableUntil: v.number(),
    donorAge: v.optional(v.number()),
    notes: v.optional(v.string()),
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

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital) {
      throw new Error("Hospital profile not found");
    }

    const organId = await ctx.db.insert("hospitalOrganAvailability", {
      hospitalId: hospital._id,
      organType: args.organType,
      bloodGroup: args.bloodGroup,
      quantity: args.quantity,
      availableUntil: args.availableUntil,
      donorAge: args.donorAge,
      status: "available",
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return organId;
  },
});

// Update organ availability
export const updateOrganAvailability = mutation({
  args: {
    organId: v.id("hospitalOrganAvailability"),
    quantity: v.optional(v.number()),
    availableUntil: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("available"),
      v.literal("allocated"),
      v.literal("transplanted"),
      v.literal("expired")
    )),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const organ = await ctx.db.get(args.organId);
    if (!organ) {
      throw new Error("Organ record not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital || organ.hospitalId !== hospital._id) {
      throw new Error("Unauthorized");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.quantity !== undefined) updates.quantity = args.quantity;
    if (args.availableUntil) updates.availableUntil = args.availableUntil;
    if (args.status) updates.status = args.status;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.organId, updates);

    return args.organId;
  },
});

// Delete organ availability record
export const deleteOrganAvailability = mutation({
  args: {
    organId: v.id("hospitalOrganAvailability"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const organ = await ctx.db.get(args.organId);
    if (!organ) {
      throw new Error("Organ record not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital || organ.hospitalId !== hospital._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.organId);
    return true;
  },
});
// Add these to your convex/hospitals.ts file

// Accept an organ transplant request
export const acceptOrganRequest = mutation({
  args: {
    requestId: v.id("organTransplantRequests"),
    message: v.optional(v.string()),
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

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital) {
      throw new Error("Hospital profile not found");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status !== "open") {
      throw new Error("This request is no longer open");
    }

    // Update request status to matched
    await ctx.db.patch(args.requestId, {
      status: "matched",
    });

    // Get requesting hospital details for notification
    const requestingHospital = await ctx.db.get(request.hospitalId);
    if (requestingHospital) {
      const requestingUser = await ctx.db.get(requestingHospital.userId);
      
      // Create notification for requesting hospital
      if (requestingUser) {
        await ctx.db.insert("notifications", {
          userId: requestingUser._id,
          title: "Organ Request Accepted! 🎉",
          message: `${hospital.hospitalName} has accepted your ${request.organType} request for ${request.patientBloodGroup} blood group. ${args.message ? 'Message: ' + args.message : 'They will contact you soon.'}`,
          type: "organ_donation",
          read: false,
          createdAt: Date.now(),
        });
      }
    }

    // Create notification for accepting hospital
    await ctx.db.insert("notifications", {
      userId: user._id,
      title: "Request Accepted",
      message: `You have accepted an organ transplant request for ${request.organType} (${request.patientBloodGroup}).`,
      type: "organ_donation",
      read: false,
      createdAt: Date.now(),
    });

    return args.requestId;
  },
});

// Get detailed incoming requests with hospital contact info
export const getDetailedIncomingRequests = query({
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

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital) {
      return [];
    }

    // Get available organs at this hospital
    const availableOrgans = await ctx.db
      .query("hospitalOrganAvailability")
      .withIndex("by_hospitalId", (q) => q.eq("hospitalId", hospital._id))
      .filter((q) => q.eq(q.field("status"), "available"))
      .collect();

    // Get all open requests from other hospitals
    const allRequests = await ctx.db
      .query("organTransplantRequests")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    // Filter requests that match available organs
    const matchingRequests = await Promise.all(
      allRequests
        .filter((request) => request.hospitalId !== hospital._id)
        .filter((request) =>
          availableOrgans.some(
            (organ) =>
              organ.organType === request.organType &&
              organ.bloodGroup === request.patientBloodGroup
          )
        )
        .map(async (request) => {
          const requestingHospital = await ctx.db.get(request.hospitalId);
          const requestingUser = requestingHospital
            ? await ctx.db.get(requestingHospital.userId)
            : null;
          
          return {
            ...request,
            requestingHospital,
            requestingUser,
          };
        })
    );

    return matchingRequests;
  },
});

// Reject an organ transplant request
export const rejectOrganRequest = mutation({
  args: {
    requestId: v.id("organTransplantRequests"),
    reason: v.optional(v.string()),
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

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital) {
      throw new Error("Hospital profile not found");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    // Get requesting hospital details for notification
    const requestingHospital = await ctx.db.get(request.hospitalId);
    if (requestingHospital) {
      const requestingUser = await ctx.db.get(requestingHospital.userId);
      
      // Create notification for requesting hospital (optional - you may not want to notify on reject)
      if (requestingUser) {
        await ctx.db.insert("notifications", {
          userId: requestingUser._id,
          title: "Request Update",
          message: `${hospital.hospitalName} is unable to fulfill your ${request.organType} request at this time.${args.reason ? ' Reason: ' + args.reason : ''}`,
          type: "organ_donation",
          read: false,
          createdAt: Date.now(),
        });
      }
    }

    return args.requestId;
  },
});
export const updateOrganTransplantRequest = mutation({
  args: {
    requestId: v.id("organTransplantRequests"),
    urgency: v.optional(v.union(v.literal("critical"), v.literal("urgent"), v.literal("normal"))),
    patientAge: v.optional(v.number()),
    additionalDetails: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital || request.hospitalId !== hospital._id) {
      throw new Error("Unauthorized: You can only edit your own requests");
    }

    if (request.status !== "open") {
      throw new Error("Cannot edit a request that is not open");
    }

    const updates: any = {};
    if (args.urgency !== undefined) updates.urgency = args.urgency;
    if (args.patientAge !== undefined) updates.patientAge = args.patientAge;
    if (args.additionalDetails !== undefined) updates.additionalDetails = args.additionalDetails;

    await ctx.db.patch(args.requestId, updates);

    return args.requestId;
  },
});

// Delete organ transplant request
export const deleteOrganTransplantRequest = mutation({
  args: {
    requestId: v.id("organTransplantRequests"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!hospital || request.hospitalId !== hospital._id) {
      throw new Error("Unauthorized: You can only delete your own requests");
    }

    if (request.status === "matched") {
      throw new Error("Cannot delete a request that has been matched");
    }

    await ctx.db.delete(args.requestId);

    return true;
  },
});