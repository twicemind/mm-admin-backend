const fs = require('fs').promises;
const path = require('path');

/**
 * Plugin Registry
 * Manages installed plugins and their metadata
 */
class PluginRegistry {
  constructor(pluginsDir) {
    this.pluginsDir = pluginsDir || path.join(process.cwd(), 'plugins');
    this.plugins = new Map();
  }

  /**
   * Initialize registry by scanning plugins directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.pluginsDir, { recursive: true });
      await this.scanPlugins();
    } catch (error) {
      console.error('Failed to initialize plugin registry:', error);
      throw error;
    }
  }

  /**
   * Scan plugins directory and load manifests
   */
  async scanPlugins() {
    try {
      const entries = await fs.readdir(this.pluginsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await this.loadPluginManifest(entry.name);
        }
      }
      
      console.log(`Found ${this.plugins.size} plugins`);
    } catch (error) {
      console.error('Failed to scan plugins:', error);
    }
  }

  /**
   * Load plugin manifest from directory
   * @param {string} pluginName - Plugin directory name
   */
  async loadPluginManifest(pluginName) {
    try {
      const manifestPath = path.join(this.pluginsDir, pluginName, 'plugin.json');
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);
      
      // Validate manifest
      if (!manifest.name || !manifest.version) {
        throw new Error(`Invalid manifest for plugin ${pluginName}`);
      }
      
      // Add plugin to registry
      this.plugins.set(manifest.name, {
        ...manifest,
        path: path.join(this.pluginsDir, pluginName),
        installed: true
      });
      
      console.log(`Loaded plugin: ${manifest.name} v${manifest.version}`);
    } catch (error) {
      console.error(`Failed to load manifest for ${pluginName}:`, error.message);
    }
  }

  /**
   * Register a new plugin
   * @param {Object} manifest - Plugin manifest
   * @param {string} pluginPath - Path to plugin directory
   */
  async register(manifest, pluginPath) {
    if (!manifest.name || !manifest.version) {
      throw new Error('Invalid plugin manifest: missing name or version');
    }
    
    this.plugins.set(manifest.name, {
      ...manifest,
      path: pluginPath,
      installed: true,
      installedAt: new Date().toISOString()
    });
    
    // Save manifest to plugin directory
    const manifestPath = path.join(pluginPath, 'plugin.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`Registered plugin: ${manifest.name} v${manifest.version}`);
  }

  /**
   * Unregister a plugin
   * @param {string} pluginName - Plugin name
   */
  async unregister(pluginName) {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} not found`);
    }
    
    this.plugins.delete(pluginName);
    console.log(`Unregistered plugin: ${pluginName}`);
  }

  /**
   * Get plugin by name
   * @param {string} pluginName - Plugin name
   * @returns {Object} Plugin data
   */
  get(pluginName) {
    return this.plugins.get(pluginName);
  }

  /**
   * Get all plugins
   * @returns {Array} All plugins
   */
  getAll() {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if plugin exists
   * @param {string} pluginName - Plugin name
   * @returns {boolean}
   */
  has(pluginName) {
    return this.plugins.has(pluginName);
  }

  /**
   * Get plugin count
   * @returns {number}
   */
  count() {
    return this.plugins.size;
  }
}

module.exports = PluginRegistry;
