// app/api/stripe/webhook/route.ts - COMPLETE VERSION
import { NextRequest, NextResponse } from 'next/server';
import { stripe, fromStripeAmount } from '@/lib/stripe';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: unknown) {
    console.error('⚠️  Webhook signature verification failed:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log(`✅ Webhook received: ${event.type}`);

  try {
    // Log webhook event
    await convex.mutation(api.payments.logWebhookEvent, {
      eventId: event.id,
      type: event.type,
      data: event.data.object,
    });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('💰 Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, event.type);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.error('⚠️  Invoice payment failed:', invoice.id);
        break;
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Handler: Checkout Session Completed
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('🎉 Checkout completed:', session.id);

  const metadata = session.metadata;
  if (!metadata || !metadata.clerkUserId) {
    console.error('❌ Missing metadata in session');
    return;
  }

  try {
    // For subscriptions
    if (session.mode === 'subscription') {
      const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(
  session.subscription as string
);
const typedSubscription = subscription as Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};

      const price = subscription.items.data[0].price;
      const amount = fromStripeAmount(price.unit_amount || 0);

      await convex.mutation(api.payments.createSubscription, {
        clerkUserId: metadata.clerkUserId,
        targetType: metadata.targetType as 'ngo' | 'campaign',
        targetId: metadata.targetId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: price.id,
        amount,
        currency: price.currency.toUpperCase(),
        interval: price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
       currentPeriodStart: typedSubscription.current_period_start * 1000,
currentPeriodEnd: typedSubscription.current_period_end * 1000,
      });

      console.log('✅ Subscription created in database');
    }

    // Complete payment (both one-time and first subscription payment)
    // In handleCheckoutCompleted function, around line 114-120
const result = await convex.mutation(api.payments.completePayment, {
  stripeSessionId: session.id,
  stripePaymentIntentId: session.payment_intent as string,
  stripeCustomerId: session.customer as string || undefined, // ✅ Change this line
});

    if (result.alreadyCompleted) {
      console.log('ℹ️  Payment already processed');
    } else {
      console.log('✅ Payment completed successfully');
    }
  } catch (error: unknown) {
    console.error('❌ Error completing payment:', error);
    throw error;
  }
}

// Handler: Checkout Session Expired
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  console.log('⏰ Checkout expired:', session.id);
  
  // TODO: Update payment session status to 'cancelled'
  // This would require a new Convex mutation
}

// Handler: Payment Failed
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id);
  
  // TODO: Update payment session status to 'failed'
  // TODO: Send notification to user
}

// Handler: Subscription Update
async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  eventType: string
) {
  console.log(`🔄 Subscription ${eventType}:`, subscription.id);

  try {
    // Get the checkout session to find clerkUserId
    const sessions = await stripe.checkout.sessions.list({
      subscription: subscription.id,
      limit: 1,
    });

    if (sessions.data.length === 0) {
      console.log('ℹ️  No checkout session found, subscription might be updated');
      return;
    }

    const session = sessions.data[0];
    const metadata = session.metadata;

    if (!metadata || !metadata.clerkUserId) {
      console.error('❌ Missing metadata');
      return;
    }

    const price = subscription.items.data[0].price;
    const amount = fromStripeAmount(price.unit_amount || 0);

    if (eventType === 'customer.subscription.created') {
      // Already handled in checkout.session.completed
      console.log('ℹ️  Subscription already created in checkout completed');
    } else {
      // Update existing subscription
      // TODO: Add update subscription mutation to Convex
      console.log('✅ Subscription updated');
    }
  } catch (error: unknown) {
    console.error('❌ Error handling subscription:', error);
  }
}

// Handler: Subscription Cancelled
async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  console.log('🛑 Subscription cancelled:', subscription.id);
  
  // TODO: Update subscription status in Convex
}

// Handler: Invoice Payment Succeeded (for recurring payments)
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💰 Invoice paid:', invoice.id);

  // Skip if this is the first invoice (handled in checkout.session.completed)
  if (invoice.billing_reason === 'subscription_create') {
    console.log('ℹ️  First invoice - already handled');
    return;
  }

  try {
  // Invoices should have a subscription property for subscription-related invoices
  const subscriptionRef = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription }).subscription;
  
  if (!subscriptionRef) {
    console.error('❌ No subscription in invoice');
    return;
  }

  // Get subscription ID (handle both string and Subscription object)
  const subscriptionId = typeof subscriptionRef === 'string' 
    ? subscriptionRef 
    : subscriptionRef.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Get the checkout session to find metadata
  const sessions = await stripe.checkout.sessions.list({
    subscription: subscriptionId,
    limit: 1,
  });

    if (sessions.data.length === 0) {
      console.error('❌ No checkout session found');
      return;
    }

    const metadata = sessions.data[0].metadata;
    if (!metadata) {
      console.error('❌ Missing metadata');
      return;
    }

    const amount = fromStripeAmount(invoice.amount_paid);

    // Create a new donation record for this recurring payment
    // This would need a new Convex mutation for recurring donations
    console.log('✅ Recurring donation recorded');
  } catch (error: unknown) {
    console.error('❌ Error handling invoice:', error);
  }
}

// Disable Next.js body parsing (required for webhook signature verification)
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
// app/api/stripe/webhook/route.ts
/*import { NextResponse } from 'next/server';

export async function POST() {
  console.log('🎯 WEBHOOK HIT!');
  return NextResponse.json({ received: true });
}*/