# Strapi Plugin Bulk Export Selected

Plugin for bulk export of selected items in Strapi v4 admin panel

## Features

- Bulk export of selected items
- Multiple content types support
- CSV format with Excel compatibility (UTF-8 BOM)
- Automatic selection detection via checkboxes
- Automatic download with customizable filenames

## Installation

```bash
npm install strapi-plugin-bulk-export-selected
```

or

```bash
yarn add strapi-plugin-bulk-export-selected
```

## Configuration

### 1. Enable the plugin

Add the plugin to your `config/plugins.js` file:

```javascript
module.exports = {
  // ... other configurations
  'bulk-export-selected': {
    enabled: true,
    config: {
      contentTypes: [
        {
          contentType: 'article', // Content type name
          uid: 'api::article.article', // Content type UID
          enabled: true
        },
        {
          contentType: 'product',
          uid: 'api::product.product',
          filename: 'products-export', // Export filename (optional)
          enabled: true,
          // Include only specific fields in export (optional)
          includeFields: ['id', 'name', 'description', 'available']
        },
        {
          contentType: 'user',
          uid: 'api::user.user',
          filename: 'users-export', 
          enabled: true,
          // Ignore specific fields from export (optional)
          ignoreFields: ['password', 'createdAt'],
          // Keep JSON fields as single cell instead of expanding (optional)
          jsonFields: ['metadata', 'settings']
        }
        // Add more content types as needed
      ]
    }
  }
};
```

## Usage

1. Access any content type list in Strapi admin
2. Select desired items using checkboxes
3. Click the **"Export Selected"** button that appears automatically
4. CSV file will be downloaded automatically

## Content Types Configuration

For each content type you want to export, configure:

- **`contentType`**: Content type name (used for identification)
- **`uid`**: Full content type UID (format: `api::name.name`)
- **`enabled`**: If true, enables export for this content type
- **`filename`** (optional): Base filename for export without extension
- **`ignoreFields`** (optional): Array of field names to exclude from export
- **`includeFields`** (optional): Array of field names to include (if specified, only these fields will be exported)
- **`jsonFields`** (optional): Array of JSON field names to keep as single cell (instead of expanding into multiple columns)

## Screenshots

### Integrated export button
The button appears automatically when items are selected:
> <img width="1195" height="645" alt="image" src="https://github.com/user-attachments/assets/d2ecbe74-22ad-4df8-a3b6-fc45522bc51d" />

## Troubleshooting

### Button doesn't appear
- Check if content type is configured in `config/plugins.js`
- Confirm that `enabled: true` is set
- Restart server after configuration changes

### Export error
- Verify that content type UID is correct
- Confirm that user has read permissions on the content type

### Empty file
- Check if items are selected
- Confirm that items have data to export
