const express = require('express');
const cors = require('cors');
const path = require('path');
const { PluginManager } = require('./plugins');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, 'HTTP');
  next();
});

// Initialize Plugin Manager
const pluginManager = new PluginManager({
  pluginsDir: path.join(__dirname, '../plugins'),
  logger: logger
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    plugins: pluginManager.getAllPlugins().length
  });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    name: 'MM Admin Backend API',
    version: '0.4.0',
    endpoints: [
      'GET /api/plugins - List all plugins',
      'GET /api/plugins/:name - Get plugin details',
      'POST /api/plugins/:name/start - Start plugin',
      'POST /api/plugins/:name/stop - Stop plugin',
      'GET /api/plugins/:name/logs - Get plugin logs',
      'GET /api/logs - Get backend logs'
    ]
  });
});

// Logs endpoint
app.get('/api/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = logger.getLogs(limit);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin version and update endpoints
app.get('/api/admin/version', (req, res) => {
  const currentVersion = '0.4.1';
  const latestVersion = '0.5.0'; // TODO: Fetch from GitHub API
  const updateAvailable = latestVersion > currentVersion;
  
  res.json({
    success: true,
    currentVersion,
    latestVersion,
    updateAvailable,
    changelog: updateAvailable ? '- Neue Plugin-Verwaltung\n- Verbessertes Logging\n- Performance-Optimierungen' : null
  });
});

app.post('/api/admin/update', (req, res) => {
  // TODO: Implement actual update logic
  // This would typically:
  // 1. Download the latest release from GitHub
  // 2. Backup current installation
  // 3. Extract and install new version
  // 4. Restart the server
  
  logger.info('Update requested', 'Admin');
  
  res.json({
    success: false,
    message: 'Update-Funktion wird noch implementiert'
  });
});

// Plugin routes
app.use('/api', pluginManager.getRouter());

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
async function startServer() {
  try {
    // Initialize plugin system
    console.log('Initializing plugin system...');
    await pluginManager.initialize();
    console.log('Plugin system initialized');

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`\n🚀 MM Admin Backend running on http://localhost:${PORT}`);
      console.log(`📦 Loaded ${pluginManager.getAllPlugins().length} plugins`);
      console.log(`💡 API documentation: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await pluginManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  await pluginManager.shutdown();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
