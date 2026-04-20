# MM-Admin Plugin System

Complete plugin system implementation for MM-Admin with backend and frontend support.

## Architecture

### Backend Plugin System

Located in `mm-admin-backend/src/plugins/`

**Components:**
- `plugin-interface.js` - Base class that all plugins must extend
- `plugin-registry.js` - Registry for tracking installed plugins
- `plugin-loader.js` - Dynamic plugin loading and lifecycle management
- `plugin-manager.js` - Central orchestrator for the plugin system
- `index.js` - Main export file

**Features:**
- ✅ Dynamic plugin loading from `plugins/` directory
- ✅ Lifecycle hooks (onLoad, onStart, onStop, onUpdate)
- ✅ Per-plugin logging and configuration
- ✅ Express router integration for plugin APIs
- ✅ Plugin metadata and status tracking

### Frontend Plugin System

Located in `mm-admin-frontend/src/app/core/services/`

**Components:**
- `plugin-registry.service.ts` - Service for plugin management

**Features:**
- ✅ HTTP communication with backend plugin API
- ✅ Reactive plugin list with RxJS
- ✅ Plugin start/stop controls
- ✅ Plugin installation from GitHub
- ✅ Log viewing

## Plugin Structure

Each plugin is a monorepo containing both backend and frontend components:

```
mma-plugin-{name}/
├── plugin.json          # Plugin manifest (required)
├── package.json         # Root package for build scripts
├── backend/             # Node.js backend component
│   ├── src/
│   │   └── index.js     # Must export class extending PluginBase
│   ├── package.json
│   └── dist/            # Built files
├── frontend/            # Angular frontend component
│   ├── src/
│   │   ├── *.component.ts
│   │   ├── *.service.ts
│   │   └── *.module.ts
│   ├── package.json
│   └── dist/            # Built files
└── README.md
```

## Plugin Manifest (plugin.json)

```json
{
  "name": "plugin-name",
  "displayName": "Plugin Display Name",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "Author name",
  "icon": "material-icon-name",
  "color": "#HEXCOLOR",
  
  "backend": {
    "entry": "dist/index.js",
    "apiPrefix": "/api/plugins/plugin-name"
  },
  
  "frontend": {
    "route": "/plugins/plugin-name",
    "menuLabel": "Plugin Menu Label",
    "menuIcon": "menu-icon"
  },
  
  "capabilities": {
    "hasSettings": true,
    "hasLogs": true,
    "supportsAutoUpdate": true
  },
  
  "repository": {
    "type": "github",
    "url": "https://github.com/owner/repo"
  }
}
```

## Creating a Plugin

### 1. Backend Implementation

```javascript
const PluginBase = require('@mm-admin/plugin-base');

class MyPlugin extends PluginBase {
  async onStart() {
    await super.onStart();
    // Initialization code
  }

  async onStop() {
    // Cleanup code
    await super.onStop();
  }

  registerRoutes(router) {
    router.get('/endpoint', (req, res) => {
      res.json({ success: true, data: 'Hello' });
    });
  }
}

module.exports = MyPlugin;
```

### 2. Frontend Implementation

```typescript
@Component({
  selector: 'app-my-plugin',
  standalone: true,
  template: `<h1>My Plugin</h1>`
})
export class MyPluginComponent {
  constructor(private http: HttpClient) {}
  
  loadData() {
    this.http.get('/api/plugins/my-plugin/endpoint')
      .subscribe(data => console.log(data));
  }
}
```

### 3. Build and Package

```bash
# Install dependencies
npm install

# Build both components
npm run build

# Create release
git tag v1.0.0
git push origin v1.0.0
```

## Integration with MM-Admin Backend

```javascript
const express = require('express');
const { PluginManager } = require('./src/plugins');

const app = express();
const pluginManager = new PluginManager({
  pluginsDir: './plugins',
  logger: console
});

// Initialize plugin system
await pluginManager.initialize();

// Register plugin routes
app.use('/api', pluginManager.getRouter());

// Shutdown on exit
process.on('SIGTERM', async () => {
  await pluginManager.shutdown();
});
```

## API Endpoints

### Plugin Management

- `GET /api/plugins` - List all plugins
- `GET /api/plugins/:name` - Get plugin details
- `POST /api/plugins/:name/start` - Start a plugin
- `POST /api/plugins/:name/stop` - Stop a plugin
- `GET /api/plugins/:name/logs` - Get plugin logs
- `POST /api/plugins/install` - Install from GitHub
- `DELETE /api/plugins/:name` - Uninstall plugin

### Plugin-Specific Routes

Each plugin registers its own routes under:
`/api/plugins/{plugin-name}/*`

## Example: System Monitor Plugin

See `mma-plugins/mma-plugin-system-monitor/` for a complete reference implementation.

**Features:**
- CPU monitoring
- Memory monitoring
- Disk usage
- Network statistics
- System information

## Installation Methods

### 1. From GitHub Release (Recommended)

```typescript
pluginRegistry.installFromGitHub(
  'https://github.com/owner/mma-plugin-name',
  'v1.0.0'
).subscribe();
```

### 2. Manual Installation

```bash
cd /opt/mm-admin/plugins
git clone https://github.com/owner/mma-plugin-name.git
cd mma-plugin-name
npm install && npm run build
```

## Best Practices

1. **Versioning**: Use semantic versioning
2. **Logging**: Use provided logger for all output
3. **Error Handling**: Always handle errors gracefully
4. **Cleanup**: Implement proper cleanup in `onStop()`
5. **Testing**: Include tests for both backend and frontend
6. **Documentation**: Provide clear README with usage examples

## Future Enhancements

- [ ] Plugin marketplace
- [ ] Automatic updates
- [ ] Plugin dependencies
- [ ] Plugin permissions system
- [ ] Sandboxed plugin execution
- [ ] Plugin development SDK

## License

MIT
