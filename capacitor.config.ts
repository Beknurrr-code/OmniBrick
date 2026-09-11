import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.omnibrick.app',
  appName: 'OmniBrick',
  webDir: 'dist',
  android: {
    backgroundColor: '#030712',
    allowMixedContent: true,
  },
};

export default config;
