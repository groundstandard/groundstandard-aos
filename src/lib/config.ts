// Environment-based configuration system
// This centralizes all environment variables and provides runtime validation

interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
    projectId: string;
  };
  stripe: {
    publishableKey: string;
  };
}

// Runtime validation for required environment variables
const getRequiredEnvVar = (key: string, fallback?: string): string => {
  const value = import.meta.env[key] || fallback;
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Centralized configuration with validation
export const config: AppConfig = {
  supabase: {
    url: getRequiredEnvVar('VITE_SUPABASE_URL'),
    anonKey: getRequiredEnvVar('VITE_SUPABASE_ANON_KEY', getRequiredEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY')),
    projectId: getRequiredEnvVar('VITE_SUPABASE_PROJECT_ID'),
  },
  stripe: {
    publishableKey: getRequiredEnvVar('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_51RmQDHGfOr7w8D1gouEtCOJY4fQjvKHdOW39g02UUJtG58oRVYEwZ5hpQjkAgoCqIy9P24s5LZPVLZFwo45b16HO00n9YR6UYo'),
  }
};

// Utility to check if we're in production
export const isProduction = () => {
  return config.stripe.publishableKey.startsWith('pk_live_');
};

// Utility to validate configuration at startup
export const validateConfig = () => {
  try {
    // Validate Supabase URL format
    new URL(config.supabase.url);
    
    // Validate Stripe key format
    if (!config.stripe.publishableKey.match(/^pk_(test|live)_/)) {
      throw new Error('Invalid Stripe publishable key format');
    }
    
    console.log('✅ Configuration validated successfully', {
      environment: isProduction() ? 'production' : 'development',
      supabaseProject: config.supabase.projectId,
      stripeMode: config.stripe.publishableKey.startsWith('pk_live_') ? 'live' : 'test'
    });
    
    return true;
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    throw error;
  }
};