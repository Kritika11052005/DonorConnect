/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as bloodDonations from "../bloodDonations.js";
import type * as donors from "../donors.js";
import type * as hospitals from "../hospitals.js";
import type * as http from "../http.js";
import type * as metrics from "../metrics.js";
import type * as ngos from "../ngos.js";
import type * as organDonation from "../organDonation.js";
import type * as popularityScores from "../popularityScores.js";
import type * as search from "../search.js";
import type * as stats from "../stats.js";
import type * as users from "../users.js";
import type * as volunteers from "../volunteers.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  bloodDonations: typeof bloodDonations;
  donors: typeof donors;
  hospitals: typeof hospitals;
  http: typeof http;
  metrics: typeof metrics;
  ngos: typeof ngos;
  organDonation: typeof organDonation;
  popularityScores: typeof popularityScores;
  search: typeof search;
  stats: typeof stats;
  users: typeof users;
  volunteers: typeof volunteers;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
