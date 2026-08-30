import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  // Android renders Google Maps and needs a key; iOS uses Apple Maps and needs none.
  // Read at build time — NOT via EXPO_PUBLIC_*, which would embed it in the JS bundle.
  const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

  if (!androidGoogleMapsApiKey) {
    console.warn(
      'GOOGLE_MAPS_ANDROID_API_KEY is not set. The Android map will render blank. ' +
        'Restrict the key to the package name and release SHA-1 before shipping.'
    );
  }

  return {
    ...config,
    // ConfigContext types these as optional; ExpoConfig requires them.
    name: config.name ?? 'proxi',
    slug: config.slug ?? 'proxi',
    plugins: [
      ...(config.plugins ?? []),
      // Declared here rather than app.json so the key can come from the environment.
      // Omitting iosGoogleMapsApiKey is deliberate: it keeps iOS on Apple Maps and
      // keeps the GoogleMaps pod out of the iOS build.
      ['react-native-maps', { androidGoogleMapsApiKey }],
    ],
  };
};
