import React from 'react';
import { Button } from '@strapi/design-system/Button';
import { useLocation } from 'react-router-dom';
import { getConfigurations } from '../../utils/config';

const BulkExportComponent = () => {
  const location = useLocation();
  const [configurations, setConfigurations] = React.useState([]);
  const [currentConfig, setCurrentConfig] = React.useState(null);
  const [selectedCount, setSelectedCount] = React.useState(0);

  React.useEffect(() => {
    const loadConfigurations = async () => {
      try {
        const configs = await getConfigurations();
        setConfigurations(configs);
      } catch (error) {
        console.error('Error loading configurations:', error);
      }
    };

    loadConfigurations();
  }, []);

  React.useEffect(() => {
    const currentPath = location.pathname;
    const config = configurations.find(c =>
      c.enabled && currentPath.includes(`collection-types/${c.uid}`) && !currentPath.match(/\/\d+$/)
    );

    setCurrentConfig(config);
  }, [location.pathname, configurations]);

  React.useEffect(() => {
    if (!currentConfig) return;

    const checkSelection = () => {
      const checkedBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
      const validIds = Array.from(checkedBoxes).filter(checkbox => {
        const id = extractId(checkbox);
        return isValidId(id);
      });

      setSelectedCount(validIds.length);
    };

    checkSelection();

    const interval = setInterval(checkSelection, 500);

    return () => clearInterval(interval);
  }, [currentConfig]);

  const extractId = (checkbox) => {
    let id = checkbox.value ||
      checkbox.getAttribute('data-id') ||
      checkbox.getAttribute('data-key') ||
      checkbox.getAttribute('data-value');

    if (!isValidId(id)) {
      const row = checkbox.closest('tr, [class*="row"], div[class*="item"]');
      if (row) {
        id = findIdInRow(row);
      }
    }

    return id;
  };

  const findIdInRow = (row) => {
    let id = row.getAttribute('data-id') ||
      row.getAttribute('data-key') ||
      row.getAttribute('id');

    if (!isValidId(id)) {
      const elements = row.querySelectorAll('[data-id], [id], a[href*="/"]');
      for (const element of elements) {
        const possibleId = element.getAttribute('data-id') ||
          element.getAttribute('id') ||
          element.getAttribute('href')?.split('/').pop();

        if (isValidId(possibleId)) {
          return possibleId;
        }
      }
    }

    return id;
  };

  const isValidId = (id) => {
    return id &&
      id !== 'on' &&
      id !== 'true' &&
      !isNaN(id) &&
      id.toString().trim() !== '';
  };

  const getSelectedIds = () => {
    const selectedIds = [];
    const checkedBoxes = document.querySelectorAll('input[type="checkbox"]:checked');

    checkedBoxes.forEach((checkbox) => {
      const id = extractId(checkbox);
      if (isValidId(id)) {
        selectedIds.push(id.toString());
      }
    });

    return selectedIds;
  };

  const handleExport = async () => {
    if (!currentConfig) return;

    const selectedIds = getSelectedIds();

    if (selectedIds.length === 0) {
      alert(currentConfig.messages?.noSelection || 'No items selected for export');
      return;
    }

    if (currentConfig.confirmBeforeExport) {
      const confirmed = confirm(`Export ${selectedIds.length} selected items?`);
      if (!confirmed) return;
    }

    try {
      const token = window.localStorage.getItem('jwtToken') ||
        window.sessionStorage.getItem('jwtToken');

      const headers = {
        'Content-Type': 'application/json',
        ...currentConfig.headers
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(currentConfig.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ids: selectedIds,
          options: currentConfig.exportOptions || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }

      let backendFilename = null;
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match?.[1]) {
          backendFilename = match[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = url;
      tempLink.download = backendFilename ?? "export_data.csv";
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    }
  };

  if (!currentConfig || selectedCount === 0) {
    return null;
  }

  return (
    <Button
      onClick={handleExport}
      variant="secondary"
      size="S"
    >
      {currentConfig.buttonText || 'Export Selected'}
    </Button>
  );
};

export default BulkExportComponent;
