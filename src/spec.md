# Specification

## Summary
**Goal:** Fix Internet Identity authentication by correcting configuration to use default service discovery and proper derivation origin for production deployment.

**Planned changes:**
- Remove hardcoded Internet Identity provider URLs from authentication configuration to rely on @dfinity/auth-client defaults
- Verify and correct derivationOrigin to match exact production frontend canister URL format
- Add pre-authentication validation that logs configuration parameters (derivationOrigin, identityProvider, maxTimeToLive) before login attempts
- Implement environment-specific configuration loading to apply correct Internet Identity settings based on deployment environment

**User-visible outcome:** Users can successfully authenticate with Internet Identity in production without being redirected to incorrect domains, with clear error messages if configuration issues occur.
