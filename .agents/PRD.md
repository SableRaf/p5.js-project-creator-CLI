# p5.js Project Creator TUI - Product Requirements Document

## Product Overview

A beautiful, interactive CLI tool for creating and managing p5.js projects with automatic p5.js version management and TypeScript IntelliSense support.

## Goals

1. Enable developers to create p5.js projects in under 2 minutes
2. Provide seamless version switching (CDN or local)
3. Automatic TypeScript type definitions integration
4. Clean, maintainable, extensible codebase using DRY principles

## Core Features

### 1. Interactive Setup Interface
- Beautiful Charm-inspired TUI using @clack/prompts
- Version selection from jsdelivr API
- CDN vs Local mode selection
- Real-time validation and feedback

### 2. Version Management
- Fetch and display available p5.js versions
- Support semver, tags (latest), or custom versions
- Automatic type definitions matching
- Persistent configuration storage

### 3. Delivery Modes
- **CDN Mode**: Links to jsdelivr CDN (default)
- **Local Mode**: Downloads p5.js to `lib/` directory

### 4. Type Definitions
- Auto-fetch from `@types/p5` on jsdelivr
- Version matching with fallback to latest
- Integrated with jsconfig.json for IntelliSense

### 5. VSCode Integration (Optional)
- Auto-run setup on folder open
- Recommended settings included

## Technical Architecture

### Design Principles

1. **Program Against Interfaces, Not Implementations**
   - Abstract API fetching, file operations, and configuration management
   - Use dependency injection for testability
   - Define clear contracts between modules

2. **DRY (Don't Repeat Yourself)**
   - Centralize common operations (fetch, file I/O, validation)
   - Reusable utility functions
   - Single source of truth for configuration

3. **Separation of Concerns**
   - API layer: Version fetching and downloads
   - Config layer: Read/write project configuration
   - UI layer: Interactive prompts and display
   - File layer: HTML manipulation, file downloads
   - Main orchestration: Coordinates all layers

### Module Structure

```
setup.js (main orchestrator)
├── api/
│   ├── IVersionProvider.js          # Interface for version fetching
│   ├── JsDelivrVersionProvider.js   # Implementation
│   └── IDownloader.js               # Interface for file downloads
├── config/
│   ├── IConfigManager.js            # Interface for config operations
│   └── ConfigManager.js             # Implementation
├── ui/
│   ├── IPromptProvider.js           # Interface for prompts
│   └── ClackPromptProvider.js       # Implementation with @clack/prompts
├── file/
│   ├── IFileManager.js              # Interface for file operations
│   └── FileManager.js               # HTML updates, downloads
└── utils/
    ├── validators.js                # Version validation, URL validation
    └── logger.js                    # Consistent logging
```

### Key Interfaces

#### IVersionProvider
```javascript
interface IVersionProvider {
  async getAvailableVersions(packageName: string): Promise<string[]>
  async getLatestVersion(packageName: string): Promise<string>
  async validateVersion(packageName: string, version: string): Promise<boolean>
}
```

#### IConfigManager
```javascript
interface IConfigManager {
  async load(): Promise<Config>
  async save(config: Config): Promise<void>
  getDefault(): Config
}
```

#### IPromptProvider
```javascript
interface IPromptProvider {
  async selectAction(current: Config): Promise<string>
  async selectVersion(versions: string[]): Promise<string>
  async selectMode(): Promise<'cdn' | 'local'>
  async confirm(message: string): Promise<boolean>
}
```

#### IFileManager
```javascript
interface IFileManager {
  async updateScriptTag(mode: string, version: string): Promise<void>
  async downloadP5(version: string, targetPath: string): Promise<void>
  async downloadTypes(version: string, targetPath: string): Promise<void>
}
```

#### IDownloader
```javascript
interface IDownloader {
  async download(url: string, targetPath: string): Promise<void>
  async fetchText(url: string): Promise<string>
  async fetchJSON(url: string): Promise<any>
}
```

## Configuration Schema

### p5-config.json
```json
{
  "version": "2.1.1",
  "mode": "cdn",
  "typeDefsVersion": "1.7.7",
  "lastUpdated": "2025-11-27T10:30:00Z"
}
```

## API Endpoints

### jsdelivr Data API
- **Package Versions**: `https://data.jsdelivr.com/v1/package/npm/{package}`
  - Response: `{ tags: { latest: "x.x.x" }, versions: ["x.x.x", ...] }`

### jsdelivr CDN
- **p5.js**: `https://cdn.jsdelivr.net/npm/p5@{version}/lib/p5.js`
- **Type Defs**: `https://cdn.jsdelivr.net/npm/@types/p5@{version}/index.d.ts`

## File Structure

```
p5-project-template/
├── .vscode/
│   ├── tasks.json              # Optional auto-run
│   └── settings.json           # Recommended settings
├── lib/                        # Local p5.js files (local mode)
├── types/
│   └── global.d.ts             # Type definitions
├── index.html                  # Template with marker comment
├── sketch.js                   # Default p5.js sketch
├── style.css                   # Basic styles
├── jsconfig.json               # IntelliSense config
├── package.json                # npm scripts + dependencies
├── setup.js                    # Main entry point
├── p5-config.json              # Project configuration
└── README.md                   # Documentation
```

## Implementation Requirements

### 1. Core Template Files

**index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <!-- P5JS_SCRIPT_TAG -->
  <link rel="stylesheet" type="text/css" href="style.css">
</head>
<body>
  <main></main>
  <script src="sketch.js"></script>
</body>
</html>
```

**sketch.js**
```javascript
function setup() {
  createCanvas(400, 400);
  background(220);
}

function draw() {
  circle(mouseX, mouseY, 20);
}
```

**jsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES6"
  },
  "include": [
    "*.js",
    "types/*.d.ts"
  ]
}
```

**package.json**
```json
{
  "name": "p5-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "setup": "node setup.js",
    "update": "node setup.js",
    "serve": "npx serve ."
  },
  "devDependencies": {
    "@clack/prompts": "^0.11.0"
  }
}
```

### 2. Setup Script Flow

```
1. Initialize dependencies (inject implementations)
2. Load current configuration (or defaults)
3. Fetch available p5.js versions from API
4. Display interactive menu
5. Process user selection:
   - Change version → version selection → mode selection
   - Switch mode → mode selection
   - Keep current → exit
6. Update files:
   - Download p5.js (if local mode)
   - Download type definitions
   - Update index.html script tag
7. Save configuration
8. Display success message
```

### 3. Error Handling

- Network errors: Retry with exponential backoff
- Version not found: Suggest similar versions
- File write errors: Check permissions, provide clear message
- Validation errors: User-friendly messages with suggestions

### 4. Validation Rules

- Version: Must exist in jsdelivr API
- Mode: Must be 'cdn' or 'local'
- Type definitions: Fallback to latest if version mismatch
- File paths: Must be writable

## User Experience

### First-time Setup
```bash
$ npm install
$ npm run setup

┌  p5.js Project Setup
│
○  Current configuration not found. Creating new project...
│
●  What would you like to do?
│  ○ Change p5.js version
│  ○ Switch between CDN/Local
│  ● Continue with defaults (p5.js latest, CDN mode)
│
◇  Select p5.js version:
│  ● 2.1.1 (latest)
│  ○ 2.1.0
│  ○ 2.0.3
│
◇  Choose delivery mode:
│  ● CDN (jsdelivr)
│  ○ Local (download to lib/)
│
◆  Downloading type definitions...
◆  Updating index.html...
◆  Configuration saved!
│
└  ✔ Setup complete! Run 'npm run serve' to start coding.
```

### Updating Version
```bash
$ npm run update

┌  p5.js Project Setup
│
●  Current: p5.js 2.1.1 (CDN mode)
│
●  What would you like to do?
│  ● Change p5.js version
│  ○ Switch between CDN/Local
│  ○ Keep current configuration
```

## Success Criteria

- [ ] Clean modular architecture with clear interfaces
- [ ] All modules independently testable
- [ ] Zero code duplication for core operations
- [ ] New version sources can be added without modifying existing code
- [ ] New UI providers can be swapped without changing business logic
- [ ] Setup completes in <2 minutes for new users
- [ ] Version switching takes <30 seconds
- [ ] TypeScript IntelliSense works immediately
- [ ] Works on Windows, macOS, Linux
- [ ] Clear error messages with actionable guidance

## Dependencies

**Production:**
- Node.js 18+ (native fetch API)

**Development:**
- `@clack/prompts`: ^0.11.0 - Beautiful CLI prompts

**Runtime (Browser):**
- p5.js (from CDN or local)

## Future Extension Points

The architecture supports future enhancements without major refactoring:

1. **Multiple Version Providers**
   - Add `NPMVersionProvider`, `GitHubVersionProvider`
   - Implement `IVersionProvider` interface

2. **Alternative UI Frameworks**
   - Swap `ClackPromptProvider` with `InquirerPromptProvider`
   - Implement `IPromptProvider` interface

3. **Additional File Formats**
   - Support TypeScript projects
   - Different HTML templates
   - Extend `IFileManager` interface

4. **Configuration Backends**
   - Store in package.json
   - Remote configuration
   - Implement `IConfigManager` interface

5. **Addon Support**
   - p5.sound library
   - Third-party libraries
   - Extend version provider to handle multiple packages

## Potential Future Enhancements (Out of Scope)

- Support for git initialization and remote repo setup
- Support for p5.sound addon library
- Multiple sketch files in one project
- Build/bundle process for production
- Template variants (p5.js, instance mode, TypeScript + ESM, etc.)
- Version pinning in package.json
- Automated testing setup
- Hot reload development server
- Support for custom builds of p5.js (with module selector: core, accessibility, friendly, Errors, data, dom, image, math, utilities, webgl, type, shape, color, io, events)
- Support for exporting sketches with bundlers like Vite, Webpack, etc. with or without minification
- Support for deploying to GitHub Pages or other static hosts
- Support for listing and managing p5 addons from third-parties (once a registry exists)

## Non-Functional Requirements

### Performance
- API calls cached for session duration
- Parallel downloads when possible
- Progress indicators for operations >1 second

### Reliability
- Retry failed network requests (3 attempts)
- Validate all user input
- Graceful degradation on network errors

### Maintainability
- Maximum function complexity: 10 lines
- Test coverage target: 80%
- JSDoc comments on all interfaces
- Clear error messages with context

### Security
- No shell command injection
- Validate all downloaded file integrity
- HTTPS only for API calls
- No execution of downloaded code

## Testing Strategy

### Unit Tests
- All interfaces have mock implementations
- Test each module in isolation
- Validate error handling

### Integration Tests
- Test module interactions
- Verify file system operations
- Validate API calls with mocks

### E2E Tests
- Full setup flow
- Version switching
- CDN/Local mode changes

---

**Version**: 1.0.0
**Last Updated**: 2025-11-27
