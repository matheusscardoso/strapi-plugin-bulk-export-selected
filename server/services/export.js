'use strict';

module.exports = ({ strapi }) => ({
  async exportSelectedItems(contentType, ids) {
    try {
      const validIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));

      if (validIds.length === 0) {
        throw new Error('No valid IDs provided');
      }

      const pluginConfig = strapi.config.get('plugin.bulk-export-selected');
      const contentTypeConfig = pluginConfig?.contentTypes?.find(c =>
        c.contentType === contentType || c.uid === contentType
      );

      const entities = await strapi.entityService.findMany(contentType, {
        filters: {
          id: { $in: validIds }
        },
        populate: contentTypeConfig?.populate || '*',
        pagination: { start: 0, limit: -1 }
      });

      if (!entities || entities.length === 0) {
        throw new Error('No entities found with provided IDs');
      }

      const filteredData = entities.map(entity => {
        if (contentTypeConfig?.includeFields?.length > 0) {
          return filterIncludedFields(contentTypeConfig, entity);
        }
        else if (contentTypeConfig?.ignoreFields?.length > 0) {
          return filterIgnoredFields(contentTypeConfig, entity);
        } else {
          return entity;
        }
      });

      const csvOptions = {
        ignoredFields: contentTypeConfig?.ignoreFields || [],
        jsonFields: contentTypeConfig?.jsonFields || []
      };

      return this.convertToCSV(filteredData, csvOptions);
    } catch (error) {
      strapi.log.error('Export service error:', error);
      throw error;
    }
  },

  convertToCSV(data, options = {}) {
    if (!data.length) return '';

    const flattened = data.map(item => flattenObject(item, options));
    const headers = Object.keys(flattened[0]).join(',');

    const rows = flattened.map(item =>
      Object.values(item).map(value => formatCsvValue(value)).join(',')
    );

    return [headers, ...rows].join('\n');
  },

});

function filterIncludedFields(typeConfig, entity) {

  const filtered = {};
  typeConfig.includeFields.forEach(field => {
    filtered[field] = entity[field];
  });
  return filtered;
}

function filterIgnoredFields(typeConfig, entity) {

  const { ...filtered } = entity;
  typeConfig.ignoreFields.forEach(field => {
    delete filtered[field];
  });


  return filtered;
}

function flattenObject(obj, options = {}, prefix = '') {
  const flattened = {};
  const ignoredFields = options.ignoredFields || [];
  const jsonFields = options.jsonFields || [];

  for (const key in obj) {
    if (ignoredFields.includes(key)) continue;

    const value = obj[key];
    const fullKey = prefix + key;

    if (value === null || value === undefined) {
      flattened[fullKey] = '';
    } else if (jsonFields.includes(key) && typeof value === 'object') {
      flattened[fullKey] = JSON.stringify(value);
    } else if (isPlainObject(value)) {
      if (value.id) {
        flattened[fullKey + '_id'] = value.id;
        if (value.name) flattened[fullKey + '_name'] = value.name;
      } else {
        Object.assign(flattened, flattenObject(value, options, fullKey + '.'));
      }
    } else if (Array.isArray(value)) {
      flattened[fullKey] = value.map(item =>
        typeof item === 'object' ? JSON.stringify(item) : item
      ).join('; ');
    } else {
      flattened[fullKey] = value;
    }
  }

  return flattened;
}

function isPlainObject(value) {
  return typeof value === 'object'
    && !Array.isArray(value) && !(value instanceof Date);
}

function formatCsvValue(value) {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') {
    const cleanValue = value
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/;/g, ' |')
      .replace(/,/g, ' |')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/"/g, '""');

    return `"${cleanValue}"`;
  }

  if (typeof value === 'object') {
    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
  }

  return value;
}
