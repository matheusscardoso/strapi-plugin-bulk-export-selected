'use strict';

module.exports = ({ strapi }) => ({
  async bulkExport(ctx) {
    try {
      const { ids } = ctx.request.body;
      const { contentType } = ctx.params;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return ctx.badRequest('IDs are required');
      }

      const service = strapi.plugin('bulk-export-selected').service('export');
      const csvData = await service.exportSelectedItems(
        contentType,
        ids
      );

      const pluginConfig = strapi.config.get('plugin.bulk-export-selected');
      const filename = getFilename(pluginConfig, contentType);

      ctx.set('Content-Type', 'text/csv; charset=utf-8');
      ctx.set('Content-Disposition', `attachment; filename="${filename}"`);
      ctx.set('Access-Control-Expose-Headers', 'Content-Disposition');

      ctx.body = '\uFEFF' + csvData;
    } catch (error) {
      strapi.log.error('Bulk export error:', error);
      ctx.internalServerError('Export failed');
    }
  },
  async getPluginConfig(ctx) {
    const pluginConfig = strapi.config.get('plugin.bulk-export-selected');
    return ctx.send({ contentTypes: pluginConfig?.contentTypes || [] });
  }
});

function getFilename(pluginConfig, contentType) {
  try {
    const typeConfig = pluginConfig?.contentTypes?.find(
      (c) => c.contentType === contentType || c.uid === contentType,
    );

    if (typeConfig?.filename) {
      const filename = getSafeFilename(typeConfig.filename);
      return filename;
    }
    if (!contentType) {
      throw new Error('contentType invalid');
    }

    return getSafeFilename(contentType);
  } catch (error) {
    console.error('Bulk export - getFilename error:', error);
    return 'export_data.csv';
  }
}

function getSafeFilename(collectionName) {
  const MAX_LENGTH = 100;
  if (!collectionName || typeof collectionName !== 'string') {
    throw new Error('Invalid collection name');
  }

  let formattedCollectionName = collectionName
    .replace(/[:\\/|<>"*?]/g, '_')
    .replace(/\./g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  if (!formattedCollectionName) {
    formattedCollectionName = 'unnamed_collection';
  }

  if (formattedCollectionName.length > MAX_LENGTH) {
    formattedCollectionName = formattedCollectionName.substring(0, MAX_LENGTH);
  }

  const datetime = getFormattedDateTime();
  return `${formattedCollectionName}_${datetime}.csv`;
}

function getFormattedDateTime() {
  return new Date().toISOString().split('.')[0].replaceAll(':', '-');
}
