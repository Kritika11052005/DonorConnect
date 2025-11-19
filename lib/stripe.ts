// lib/stripe.ts
import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

// Client-side Stripe promise
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
) as Promise<import('stripe').Stripe | null>;
  }
  return stripePromise;
};

// Currency configuration
export const CURRENCY = 'INR';
export const MIN_AMOUNT = 100; // ₹1.00 minimum
export const MAX_AMOUNT = 10000000; // ₹100,000 maximum

// Helper to format currency
export const formatCurrency = (amount: number, currency: string = CURRENCY) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper to convert amount to Stripe format (paise)
export const toStripeAmount = (amount: number) => {
  return Math.round(amount * 100);
};

// Helper to convert from Stripe format
export const fromStripeAmount = (amount: number) => {
  return amount / 100;
};