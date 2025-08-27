import BulkExportComponent from '../BulkExportComponent';
import { getConfigurations } from '../../utils/config';

class BulkExportManager {
  constructor() {
    this.buttons = new Map();
    this.configurations = [];
  }

  async initialize() {
    this.configurations = await getConfigurations();

    this.configurations.forEach(config => {
      if (config.enabled) {
        const button = new BulkExportComponent(config);
        button.initialize();
        this.buttons.set(config.contentType, button);
      }
    });
  }

  destroy() {
    this.buttons.forEach(button => button.destroy());
    this.buttons.clear();
  }
}

export default BulkExportManager;
