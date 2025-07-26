import { loadStripe } from '@stripe/stripe-js';

// Centralized Stripe configuration to avoid multiple instances and key conflicts
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RmQDHGfOr7w8D1gouEtCOJY4fQjvKHdOW39g02UUJtG58oRVYEwZ5hpQjkAgoCqIy9P24s5LZPVLZFwo45b16HO00n9YR6UYo';

// Single instance of Stripe to prevent conflicts
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

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