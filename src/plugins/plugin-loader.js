const path = require('path');
const PluginBase = require('./plugin-interface');

/**
 * Plugin Loader
 * Dynamically loads and manages plugin instances
 */
class PluginLoader {
  constructor(registry, logger) {
    this.registry = registry;
    this.logger = logger;
    this.loadedPlugins = new Map();
  }

  /**
   * Load a plugin by name
   * @param {string} pluginName - Plugin name
   * @returns {Object} Plugin instance
   */
  async load(pluginName) {
    try {
      // Check if already loaded
      if (this.loadedPlugins.has(pluginName)) {
        return this.loadedPlugins.get(pluginName);
      }

      // Get plugin metadata from registry
      const pluginData = this.registry.get(pluginName);
      if (!pluginData) {
        throw new Error(`Plugin ${pluginName} not found in registry`);
      }

      // Load plugin module
      const pluginPath = path.join(pluginData.path, 'backend', pluginData.backend.entry);
      const PluginClass = require(pluginPath);

      // Validate plugin class
      if (!PluginClass.prototype instanceof PluginBase) {
        throw new Error(`Plugin ${pluginName} does not extend PluginBase`);
      }

      // Create plugin instance
      const context = {
        logger: this.createPluginLogger(pluginName),
        config: this.createPluginConfig(pluginName)
      };
      
      const pluginInstance = new PluginClass(pluginData, context);

      // Call lifecycle hook
      await pluginInstance.onLoad();

      // Store instance
      this.loadedPlugins.set(pluginName, pluginInstance);

      this.logger.info(`Loaded plugin: ${pluginName}`);
      return pluginInstance;
    } catch (error) {
      this.logger.error(`Failed to load plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * Unload a plugin
   * @param {string} pluginName - Plugin name
   */
  async unload(pluginName) {
    const plugin = this.loadedPlugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not loaded`);
    }

    try {
      // Stop plugin if running
      if (plugin.isRunning) {
        await plugin.onStop();
      }

      // Remove from cache
      this.loadedPlugins.delete(pluginName);

      // Clear require cache
      const pluginData = this.registry.get(pluginName);
      if (pluginData) {
        const pluginPath = path.join(pluginData.path, 'backend', pluginData.backend.entry);
        delete require.cache[require.resolve(pluginPath)];
      }

      this.logger.info(`Unloaded plugin: ${pluginName}`);
    } catch (error) {
      this.logger.error(`Failed to unload plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * Start a loaded plugin
   * @param {string} pluginName - Plugin name
   */
  async start(pluginName) {
    const plugin = this.loadedPlugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not loaded`);
    }

    if (plugin.isRunning) {
      this.logger.warn(`Plugin ${pluginName} is already running`);
      return;
    }

    await plugin.onStart();
    this.logger.info(`Started plugin: ${pluginName}`);
  }

  /**
   * Stop a running plugin
   * @param {string} pluginName - Plugin name
   */
  async stop(pluginName) {
    const plugin = this.loadedPlugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not loaded`);
    }

    if (!plugin.isRunning) {
      this.logger.warn(`Plugin ${pluginName} is not running`);
      return;
    }

    await plugin.onStop();
    this.logger.info(`Stopped plugin: ${pluginName}`);
  }

  /**
   * Get a loaded plugin instance
   * @param {string} pluginName - Plugin name
   * @returns {Object} Plugin instance
   */
  get(pluginName) {
    return this.loadedPlugins.get(pluginName);
  }

  /**
   * Get all loaded plugins
   * @returns {Array} Array of plugin instances
   */
  getAll() {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Check if plugin is loaded
   * @param {string} pluginName - Plugin name
   * @returns {boolean}
   */
  isLoaded(pluginName) {
    return this.loadedPlugins.has(pluginName);
  }

  /**
   * Create a logger for a plugin
   * @param {string} pluginName - Plugin name
   * @returns {Object} Logger instance
   */
  createPluginLogger(pluginName) {
    const logs = [];
    return {
      info: (message, ...args) => {
        const entry = { level: 'info', message, args, timestamp: new Date().toISOString() };
        logs.push(entry);
        console.log(`[${pluginName}] INFO:`, message, ...args);
      },
      warn: (message, ...args) => {
        const entry = { level: 'warn', message, args, timestamp: new Date().toISOString() };
        logs.push(entry);
        console.warn(`[${pluginName}] WARN:`, message, ...args);
      },
      error: (message, ...args) => {
        const entry = { level: 'error', message, args, timestamp: new Date().toISOString() };
        logs.push(entry);
        console.error(`[${pluginName}] ERROR:`, message, ...args);
      },
      debug: (message, ...args) => {
        const entry = { level: 'debug', message, args, timestamp: new Date().toISOString() };
        logs.push(entry);
        console.debug(`[${pluginName}] DEBUG:`, message, ...args);
      },
      getLogs: (limit = 100) => logs.slice(-limit)
    };
  }

  /**
   * Create a config manager for a plugin
   * @param {string} pluginName - Plugin name
   * @returns {Object} Config manager
   */
  createPluginConfig(pluginName) {
    const config = {};
    return {
      get: (key, defaultValue) => {
        return config[key] !== undefined ? config[key] : defaultValue;
      },
      set: async (key, value) => {
        config[key] = value;
      }
    };
  }
}

module.exports = PluginLoader;
