import pluginId from '../pluginId';

export async function getConfigurations() {
  const BULK_EXPORT_BASE_URL = '/bulk-export-selected';

  if (window.strapiConfig?.plugins?.[pluginId]?.contentTypes) {
    return window.strapiConfig.plugins[pluginId].contentTypes;
  }

  try {
    const response = await fetch(`${BULK_EXPORT_BASE_URL}/config`);
    if (response.ok) {
      const data = await response.json();

      const contentTypesWithEndpoints = data.contentTypes?.map(config => ({
        ...config,
        endpoint: config.endpoint || `${BULK_EXPORT_BASE_URL}/export/${config.uid}/bulk`
      })) || [];

      if (!window.strapiConfig) {
        window.strapiConfig = {};
      }
      if (!window.strapiConfig.plugins) {
        window.strapiConfig.plugins = {};
      }

      window.strapiConfig.plugins[pluginId] = {
        ...data,
        contentTypes: contentTypesWithEndpoints
      };

      return contentTypesWithEndpoints;
    }
  } catch (error) {
    console.error('Error fetching plugin configuration:', error);
  }

  return [];
}
