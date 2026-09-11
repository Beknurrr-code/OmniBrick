/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REVENUECAT_API_KEY?: string;
  readonly VITE_REVENUECAT_ANDROID_KEY?: string;
  readonly VITE_REVENUECAT_IOS_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;
  readonly VITE_OLLAMA_ENDPOINT?: string;
  readonly VITE_OLLAMA_API_KEY?: string;
  readonly VITE_OLLAMA_MODEL?: string;
  readonly VITE_DEFAULT_AI_PROVIDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
