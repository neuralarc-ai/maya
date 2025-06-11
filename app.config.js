import 'dotenv/config';

if (!process.env.ELEVEN_LABS_API_KEY) {
  console.error('ELEVEN_LABS_API_KEY is not set in .env file');
}

module.exports = {
  name: "CEO Voice Agent",
  slug: "ceo-voice-agent",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.sahilgupta.x28.jarvis",
    infoPlist: {
      NSMicrophoneUsageDescription: "This app uses the microphone to record audio for voice interactions.",
      UIBackgroundModes: ["audio"]
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#1a1a1a"
    },
    package: "com.sahilgupta.x28.jarvis"
  },
  web: {
    bundler: "metro"
  },
  scheme: "jarvis",
  plugins: [
    [
      "expo-av",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone."
      }
    ]
  ],
  extra: {
    eas: {
      projectId: "your-project-id"
    },
    elevenLabsApiKey: process.env.ELEVEN_LABS_API_KEY
  }
}; 