/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_CANISTER_ID: string;
  readonly VITE_INTERNET_IDENTITY_URL?: string;
  readonly VITE_DERIVATION_ORIGIN?: string;
  readonly VITE_AUTH_ENVIRONMENT?: 'development' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
