import { loadStripe } from '@stripe/stripe-js';
import { config, validateConfig } from '@/lib/config';

// Validate configuration before initializing Stripe
validateConfig();

const stripePublishableKey = config.stripe.publishableKey?.trim() || null;

// Centralized Stripe configuration using environment variables
// Single instance of Stripe to prevent conflicts
export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : Promise.resolve(null);

// Common Stripe Elements configuration to ensure consistency
export const getStripeElementsOptions = (clientSecret: string) => ({
  clientSecret,
  appearance: {
    variables: {
      colorBackground: '#ffffff',
    },
    rules: {
      '.LinkContainer': {
        display: 'none !important'
      },
      '.PickerItemContainer--selected .PickerItem--Link': {
        display: 'none !important'
      },
      '.TabContainer .Tab--Link': {
        display: 'none !important'
      },
      '.ExpressCheckoutContainer': {
        display: 'none !important'
      },
      '.LinkAuthenticationContainer': {
        display: 'none !important'
      },
      '.p-LinkAuthenticationContainer': {
        display: 'none !important'
      }
    }
  },
  loader: 'always' as const
});

// Common PaymentElement options
export const getPaymentElementOptions = () => ({
  layout: {
    type: 'accordion' as const,
    defaultCollapsed: false,
  },
  paymentMethodOrder: ['card'],
  fields: {
    billingDetails: {
      name: 'never' as const,
      email: 'never' as const,
      phone: 'never' as const,
      address: 'never' as const
    }
  },
  wallets: {
    applePay: 'never' as const,
    googlePay: 'never' as const
  },
  terms: {
    card: 'never' as const
  }
});