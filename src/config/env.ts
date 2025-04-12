import Constants from 'expo-constants';

// Get the environment variables from Expo's manifest
const ENV = Constants.expoConfig?.extra || {};

interface Config {
  openAiApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

const config: Config = {
  openAiApiKey: ENV.openAiApiKey || process.env.OPENAI_API_KEY || '',
  supabaseUrl: ENV.supabaseUrl || process.env.SUPABASE_URL || '',
  supabaseAnonKey: ENV.supabaseAnonKey || process.env.SUPABASE_ANON_KEY || '',
};

// Validate the configuration
const requiredKeys: (keyof Config)[] = ['openAiApiKey', 'supabaseUrl', 'supabaseAnonKey'];
for (const key of requiredKeys) {
  if (!config[key]) {
    console.warn(`Missing required environment variable: ${key}`);
  }
}

export default config; 