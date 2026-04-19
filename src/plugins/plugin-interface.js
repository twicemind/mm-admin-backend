/**
 * Base class for all MM-Admin plugins
 * All plugins must extend this class
 */
class PluginBase {
  /**
   * @param {Object} manifest - Plugin manifest data
   * @param {Object} context - Plugin context (logger, config, etc.)
   */
  constructor(manifest, context) {
    this.manifest = manifest;
    this.name = manifest.name;
    this.version = manifest.version;
    this.logger = context.logger;
    this.config = context.config;
    this.isRunning = false;
  }

  /**
   * Called when plugin is loaded (before start)
   */
  async onLoad() {
    this.logger.info(`Plugin ${this.name} loaded`);
  }

  /**
   * Called when plugin should start
   */
  async onStart() {
    this.isRunning = true;
    this.logger.info(`Plugin ${this.name} started`);
  }

  /**
   * Called when plugin should stop
   */
  async onStop() {
    this.isRunning = false;
    this.logger.info(`Plugin ${this.name} stopped`);
  }

  /**
   * Called before plugin update
   * @param {string} newVersion - New version number
   */
  async onUpdate(newVersion) {
    this.logger.info(`Plugin ${this.name} updating from ${this.version} to ${newVersion}`);
  }

  /**
   * Register plugin routes with Express router
   * @param {Object} router - Express router instance
   */
  registerRoutes(router) {
    // Override in plugin implementation
    this.logger.debug(`Plugin ${this.name} has no routes to register`);
  }

  /**
   * Get plugin metadata
   * @returns {Object} Plugin manifest
   */
  getMetadata() {
    return {
      name: this.name,
      displayName: this.manifest.displayName,
      version: this.version,
      description: this.manifest.description,
      author: this.manifest.author,
      icon: this.manifest.icon,
      color: this.manifest.color
    };
  }

  /**
   * Get plugin status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      running: this.isRunning,
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }

  /**
   * Get plugin logs
   * @param {number} limit - Maximum number of log entries
   * @returns {Array} Log entries
   */
  getLogs(limit = 100) {
    return this.logger.getLogs(limit);
  }

  /**
   * Get plugin settings schema
   * @returns {Object} JSON schema for settings
   */
  getSettingsSchema() {
    return this.manifest.settingsSchema || {};
  }

  /**
   * Get current plugin settings
   * @returns {Object} Current settings
   */
  getSettings() {
    return this.config.get(`plugins.${this.name}`, {});
  }

  /**
   * Update plugin settings
   * @param {Object} settings - New settings
   */
  async updateSettings(settings) {
    await this.config.set(`plugins.${this.name}`, settings);
    this.logger.info(`Plugin ${this.name} settings updated`);
  }
}

module.exports = PluginBase;
