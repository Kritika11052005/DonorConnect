// app/api/stripe/create-checkout-session/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { stripe, toStripeAmount, CURRENCY } from '@/lib/stripe';
import { currentUser } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    console.log('🔍 User Check:', { 
      hasUser: !!user, 
      userId: user?.id,
      email: user?.emailAddresses?.[0]?.emailAddress 
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in again' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      amount,
      targetType, // 'ngo' or 'campaign'
      targetId,
      targetName,
      donationType, // 'one_time' or 'recurring'
      itemType, // 'money', 'books', etc.
    } = body;

    console.log('📝 Donation Request:', {
      amount,
      targetType,
      targetId,
      targetName,
      donationType,
      itemType,
    });

    // Validate amount
    if (!amount || amount < 1 || amount > 100000) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const stripeAmount = toStripeAmount(amount);
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL;
    const userEmail = user.emailAddresses?.[0]?.emailAddress || user.id;

    console.log('💰 Stripe Amount:', stripeAmount, 'Currency:', CURRENCY);

    // For recurring donations, create a subscription
    if (donationType === 'recurring') {
      console.log('🔄 Creating recurring subscription...');
      
      // Create or retrieve customer
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      let customer;
      if (customers.data.length > 0) {
        customer = customers.data[0];
        console.log('✅ Found existing customer:', customer.id);
      } else {
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            clerkUserId: user.id,
          },
        });
        console.log('✅ Created new customer:', customer.id);
      }

      // Create a price for this subscription
      const price = await stripe.prices.create({
        currency: CURRENCY.toLowerCase(),
        unit_amount: stripeAmount,
        recurring: {
          interval: 'month',
        },
        product_data: {
          name: `Monthly donation to ${targetName}`,
          metadata: {
            targetType,
            targetId,
          },
        },
      });
      console.log('✅ Created price:', price.id);

      // Create checkout session for subscription
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        success_url: `${origin}/donation/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/donation/cancelled`,
        metadata: {
          clerkUserId: user.id,
          targetType,
          targetId,
          targetName,
          donationType,
          itemType: itemType || 'money',
        },
      });

      // ✅ CREATE PAYMENT SESSION IN CONVEX
      await convex.mutation(api.payments.createPaymentSession, {
        clerkUserId: user.id,
        targetType: targetType as 'ngo' | 'campaign',
        targetId: targetId,
        stripeSessionId: session.id,
        amount: amount,
        currency: CURRENCY,
        paymentType: 'recurring',
        donationItemType: itemType,
      });

      console.log('✅ Created subscription session:', session.id);
      console.log('✅ Created payment session in Convex');
      console.log('🔗 Redirect URL:', session.url);

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
      });
    }

    // For one-time donations
    console.log('💳 Creating one-time payment...');
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        {
          price_data: {
            currency: CURRENCY.toLowerCase(),
            product_data: {
              name: `Donation to ${targetName}`,
              description: `${itemType === 'money' ? 'Monetary' : itemType} donation`,
              metadata: {
                targetType,
                targetId,
              },
            },
            unit_amount: stripeAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/donation/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/donation/cancelled`,
      metadata: {
        clerkUserId: user.id,
        targetType,
        targetId,
        targetName,
        donationType,
        itemType: itemType || 'money',
      },
    });

    // ✅ CREATE PAYMENT SESSION IN CONVEX - THIS WAS MISSING!
    await convex.mutation(api.payments.createPaymentSession, {
      clerkUserId: user.id,
      targetType: targetType as 'ngo' | 'campaign',
      targetId: targetId,
      stripeSessionId: session.id,
      amount: amount,
      currency: CURRENCY,
      paymentType: 'one_time',
      donationItemType: itemType,
    });

    console.log('✅ Created payment session:', session.id);
    console.log('✅ Created payment session in Convex');
    console.log('🔗 Redirect URL:', session.url);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: unknown) {
    console.error('❌ Stripe checkout error:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}