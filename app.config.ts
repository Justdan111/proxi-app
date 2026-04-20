import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const mapboxDownloadsToken = process.env.MAPBOX_DOWNLOADS_TOKEN;

  if (!mapboxDownloadsToken) {
    console.warn(
      'MAPBOX_DOWNLOADS_TOKEN is not set. iOS/Android native builds with @rnmapbox/maps may fail during dependency install.'
    );
  }

  const basePlugins = config.plugins ?? [];
  const pluginsWithoutMapbox = basePlugins.filter((plugin) => {
    if (typeof plugin === 'string') return plugin !== '@rnmapbox/maps';
    return plugin[0] !== '@rnmapbox/maps';
  });

  const mapboxPlugin: NonNullable<ExpoConfig['plugins']>[number] = [
    '@rnmapbox/maps',
    {
      RNMapboxMapsDownloadToken: mapboxDownloadsToken ?? '',
    },
  ];

  return {
    ...config,
    plugins: [...pluginsWithoutMapbox, mapboxPlugin],
  };
};
