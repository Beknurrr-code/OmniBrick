import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.brainbrick.app',
  appName: 'Brain Brick',
  webDir: 'dist',
  android: {
    backgroundColor: '#030712',
    allowMixedContent: true,
  },
};

export default config;
