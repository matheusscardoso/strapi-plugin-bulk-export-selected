'use strict';

module.exports = [
  {
    method: 'POST',
    path: '/export/:contentType/bulk',
    handler: 'export.bulkExport',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/config',
    handler: 'export.getPluginConfig',
    config: { auth: false }
  }
];
