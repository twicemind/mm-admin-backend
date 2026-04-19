const PluginRegistry = require('./plugin-registry');
const PluginLoader = require('./plugin-loader');
const express = require('express');

/**
 * Plugin Manager
 * Central orchestrator for the plugin system
 */
class PluginManager {
  constructor(options = {}) {
    this.pluginsDir = options.pluginsDir || 'plugins';
    this.logger = options.logger || console;
    
    this.registry = new PluginRegistry(this.pluginsDir);
    this.loader = new PluginLoader(this.registry, this.logger);
    this.router = express.Router();
    this.initialized = false;
  }

  /**
   * Initialize the plugin system
   */
  async initialize() {
    if (this.initialized) {
      this.logger.warn('Plugin manager already initialized');
      return;
    }

    try {
      this.logger.info('Initializing plugin system...');
      
      // Initialize registry
      await this.registry.initialize();
      
      // Load and start all installed plugins
      const plugins = this.registry.getAll();
      for (const pluginData of plugins) {
        try {
          await this.loadPlugin(pluginData.name);
          await this.startPlugin(pluginData.name);
        } catch (error) {
          this.logger.error(`Failed to initialize plugin ${pluginData.name}:`, error);
        }
      }
      
      // Setup API routes
      this.setupApiRoutes();
      
      this.initialized = true;
      this.logger.info(`Plugin system initialized with ${plugins.length} plugins`);
    } catch (error) {
      this.logger.error('Failed to initialize plugin system:', error);
      throw error;
    }
  }

  /**
   * Load a plugin
   * @param {string} pluginName - Plugin name
   */
  async loadPlugin(pluginName) {
    const plugin = await this.loader.load(pluginName);
    
    // Register plugin routes
    const pluginRouter = express.Router();
    plugin.registerRoutes(pluginRouter);
    
    const pluginData = this.registry.get(pluginName);
    const apiPrefix = pluginData.backend.apiPrefix || `/api/plugins/${pluginName}`;
    this.router.use(apiPrefix, pluginRouter);
    
    this.logger.info(`Plugin routes registered: ${apiPrefix}`);
    
    return plugin;
  }

  /**
   * Unload a plugin
   * @param {string} pluginName - Plugin name
   */
  async unloadPlugin(pluginName) {
    await this.loader.unload(pluginName);
  }

  /**
   * Start a plugin
   * @param {string} pluginName - Plugin name
   */
  async startPlugin(pluginName) {
    await this.loader.start(pluginName);
  }

  /**
   * Stop a plugin
   * @param {string} pluginName - Plugin name
   */
  async stopPlugin(pluginName) {
    await this.loader.stop(pluginName);
  }

  /**
   * Get plugin instance
   * @param {string} pluginName - Plugin name
   * @returns {Object} Plugin instance
   */
  getPlugin(pluginName) {
    return this.loader.get(pluginName);
  }

  /**
   * Get all plugins metadata
   * @returns {Array} Array of plugin metadata
   */
  getAllPlugins() {
    return this.registry.getAll().map(pluginData => {
      const plugin = this.loader.get(pluginData.name);
      return {
        ...pluginData,
        status: plugin ? plugin.getStatus() : { running: false }
      };
    });
  }

  /**
   * Install a plugin from GitHub
   * @param {string} repository - GitHub repository URL
   * @param {string} release - Release tag
   */
  async installFromGitHub(repository, release) {
    // TODO: Implement GitHub installation
    throw new Error('GitHub installation not yet implemented');
  }

  /**
   * Uninstall a plugin
   * @param {string} pluginName - Plugin name
   */
  async uninstall(pluginName) {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Stop and unload plugin
    if (this.loader.isLoaded(pluginName)) {
      await this.stopPlugin(pluginName);
      await this.unloadPlugin(pluginName);
    }
    
    // Get plugin path
    const pluginData = this.registry.get(pluginName);
    if (!pluginData) {
      throw new Error(`Plugin ${pluginName} not found`);
    }
    
    // Remove plugin directory
    await fs.rm(pluginData.path, { recursive: true, force: true });
    
    // Unregister plugin
    await this.registry.unregister(pluginName);
    
    this.logger.info(`Uninstalled plugin: ${pluginName}`);
  }

  /**
   * Setup API routes for plugin management
   */
  setupApiRoutes() {
    // Get all plugins
    this.router.get('/plugins', (req, res) => {
      try {
        const plugins = this.getAllPlugins();
        res.json({ success: true, plugins });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get single plugin
    this.router.get('/plugins/:name', (req, res) => {
      try {
        const pluginData = this.registry.get(req.params.name);
        if (!pluginData) {
          return res.status(404).json({ success: false, error: 'Plugin not found' });
        }
        
        const plugin = this.loader.get(req.params.name);
        const status = plugin ? plugin.getStatus() : { running: false };
        
        res.json({ success: true, plugin: { ...pluginData, status } });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Start plugin
    this.router.post('/plugins/:name/start', async (req, res) => {
      try {
        await this.startPlugin(req.params.name);
        res.json({ success: true, message: `Plugin ${req.params.name} started` });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Stop plugin
    this.router.post('/plugins/:name/stop', async (req, res) => {
      try {
        await this.stopPlugin(req.params.name);
        res.json({ success: true, message: `Plugin ${req.params.name} stopped` });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get plugin logs
    this.router.get('/plugins/:name/logs', (req, res) => {
      try {
        const plugin = this.loader.get(req.params.name);
        if (!plugin) {
          return res.status(404).json({ success: false, error: 'Plugin not loaded' });
        }
        
        const limit = parseInt(req.query.limit) || 100;
        const logs = plugin.getLogs(limit);
        res.json({ success: true, logs });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Install plugin from GitHub
    this.router.post('/plugins/install', async (req, res) => {
      try {
        const { repository, release } = req.body;
        await this.installFromGitHub(repository, release);
        res.json({ success: true, message: 'Plugin installed successfully' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Uninstall plugin
    this.router.delete('/plugins/:name', async (req, res) => {
      try {
        await this.uninstall(req.params.name);
        res.json({ success: true, message: `Plugin ${req.params.name} uninstalled` });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  /**
   * Get Express router with all plugin routes
   * @returns {Object} Express router
   */
  getRouter() {
    return this.router;
  }

  /**
   * Shutdown plugin system
   */
  async shutdown() {
    this.logger.info('Shutting down plugin system...');
    
    const plugins = this.loader.getAll();
    for (const plugin of plugins) {
      try {
        if (plugin.isRunning) {
          await plugin.onStop();
        }
      } catch (error) {
        this.logger.error(`Error stopping plugin ${plugin.name}:`, error);
      }
    }
    
    this.logger.info('Plugin system shut down');
  }
}

module.exports = PluginManager;
