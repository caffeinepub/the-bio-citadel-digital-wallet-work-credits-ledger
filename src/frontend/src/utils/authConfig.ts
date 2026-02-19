/**
 * Authentication configuration utilities for Internet Identity
 * Provides environment-specific configuration and validation
 */

interface AuthConfig {
  derivationOrigin?: string;
  identityProvider?: string;
  environment: 'development' | 'production';
}

/**
 * Detects the current environment based on hostname
 */
function detectEnvironment(): 'development' | 'production' {
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  // Production on Internet Computer
  if (hostname.endsWith('.ic0.app') || hostname.endsWith('.icp0.io') || hostname.endsWith('.raw.ic0.app')) {
    return 'production';
  }
  
  // Default to production for safety
  return 'production';
}

/**
 * Validates derivation origin format
 */
function validateDerivationOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // undefined is valid (uses default)
  
  try {
    const url = new URL(origin);
    // Must be https in production
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      console.warn(`[Auth Config] Invalid protocol in derivationOrigin: ${url.protocol}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[Auth Config] Invalid derivationOrigin URL: ${origin}`, e);
    return false;
  }
}

/**
 * Loads and validates authentication configuration
 */
export function loadAuthConfig(): AuthConfig {
  const environment = detectEnvironment();
  
  console.log('[Auth Config] Loading authentication configuration...');
  console.log('[Auth Config] Environment:', environment);
  console.log('[Auth Config] Hostname:', window.location.hostname);
  console.log('[Auth Config] Origin:', window.location.origin);
  
  const config: AuthConfig = {
    environment,
    derivationOrigin: undefined,
    identityProvider: undefined
  };
  
  // In production, set derivationOrigin to current origin
  if (environment === 'production') {
    config.derivationOrigin = window.location.origin;
    console.log('[Auth Config] Production mode - using derivationOrigin:', config.derivationOrigin);
  } else {
    console.log('[Auth Config] Development mode - no derivationOrigin set');
  }
  
  // Check for environment variable overrides
  const envDerivationOrigin = import.meta.env.VITE_DERIVATION_ORIGIN;
  if (envDerivationOrigin) {
    console.log('[Auth Config] Found VITE_DERIVATION_ORIGIN override:', envDerivationOrigin);
    if (validateDerivationOrigin(envDerivationOrigin)) {
      config.derivationOrigin = envDerivationOrigin;
    } else {
      console.error('[Auth Config] Invalid VITE_DERIVATION_ORIGIN, ignoring override');
    }
  }
  
  // IMPORTANT: Do NOT set identityProvider - let @dfinity/auth-client use its default
  // The library automatically discovers the correct Internet Identity service
  const envIdentityProvider = import.meta.env.VITE_INTERNET_IDENTITY_URL;
  if (envIdentityProvider) {
    console.warn('[Auth Config] VITE_INTERNET_IDENTITY_URL is set but will be ignored.');
    console.warn('[Auth Config] The auth-client library will use its default Internet Identity service.');
  }
  
  // Validate configuration
  if (!validateDerivationOrigin(config.derivationOrigin)) {
    console.error('[Auth Config] Configuration validation failed!');
    console.error('[Auth Config] derivationOrigin is invalid:', config.derivationOrigin);
  }
  
  console.log('[Auth Config] Final configuration:', {
    environment: config.environment,
    derivationOrigin: config.derivationOrigin || '(using default)',
    identityProvider: '(using @dfinity/auth-client default)'
  });
  
  return config;
}

/**
 * Logs diagnostic information for troubleshooting authentication issues
 */
export function logAuthDiagnostics(): void {
  console.group('[Auth Diagnostics] Authentication Configuration Check');
  
  const config = loadAuthConfig();
  
  console.log('Environment Detection:');
  console.log('  - Hostname:', window.location.hostname);
  console.log('  - Origin:', window.location.origin);
  console.log('  - Protocol:', window.location.protocol);
  console.log('  - Detected Environment:', config.environment);
  
  console.log('\nConfiguration:');
  console.log('  - derivationOrigin:', config.derivationOrigin || '(default)');
  console.log('  - identityProvider:', config.identityProvider || '(default - auto-discovered)');
  
  console.log('\nEnvironment Variables:');
  console.log('  - VITE_DERIVATION_ORIGIN:', import.meta.env.VITE_DERIVATION_ORIGIN || '(not set)');
  console.log('  - VITE_INTERNET_IDENTITY_URL:', import.meta.env.VITE_INTERNET_IDENTITY_URL || '(not set)');
  console.log('  - VITE_BACKEND_CANISTER_ID:', import.meta.env.VITE_BACKEND_CANISTER_ID || '(not set)');
  
  console.log('\nValidation:');
  const isValid = validateDerivationOrigin(config.derivationOrigin);
  console.log('  - Configuration Valid:', isValid ? '✓' : '✗');
  
  if (!isValid) {
    console.error('\n⚠️ Configuration Issues Detected:');
    console.error('  - The derivationOrigin is invalid or misconfigured');
    console.error('  - This may cause authentication to fail');
    console.error('  - Please check your environment variables and deployment settings');
  }
  
  console.groupEnd();
}
