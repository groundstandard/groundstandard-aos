// Environment-based configuration system
// This centralizes all environment variables and provides runtime validation

interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
    projectId: string;
  };
  stripe: {
    publishableKey: string | null;
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

// Get optional environment variable (returns null if not set)
const getOptionalEnvVar = (key: string): string | null => {
  return import.meta.env[key] || null;
};

// Centralized configuration with validation
export const config: AppConfig = {
  supabase: {
    url: getRequiredEnvVar('VITE_SUPABASE_URL'),
    anonKey: getRequiredEnvVar('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
    projectId: getRequiredEnvVar('VITE_SUPABASE_PROJECT_ID'),
  },
  stripe: {
    publishableKey: getOptionalEnvVar('VITE_STRIPE_PUBLISHABLE_KEY'),
  }
};

// Utility to check if we're in production
export const isProduction = () => {
  return config.stripe.publishableKey?.startsWith('pk_live_') || false;
};

// Utility to check if Stripe is configured
export const isStripeConfigured = () => {
  return !!config.stripe.publishableKey;
};

// Utility to validate configuration at startup
export const validateConfig = () => {
  try {
    // Validate Supabase URL format
    new URL(config.supabase.url);
    
    // Validate Stripe key format only if configured
    if (config.stripe.publishableKey && !config.stripe.publishableKey.match(/^pk_(test|live)_/)) {
      console.warn('Invalid Stripe publishable key format - Stripe features will be disabled');
    }
    
    console.log('✅ Configuration validated successfully', {
      environment: isProduction() ? 'production' : 'development',
      supabaseProject: config.supabase.projectId,
      stripeMode: config.stripe.publishableKey 
        ? (config.stripe.publishableKey.startsWith('pk_live_') ? 'live' : 'test')
        : 'not configured'
    });
    
    return true;
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    throw error;
  }
};