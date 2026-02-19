/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_CANISTER_ID: string;
  readonly II_URL?: string;
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
