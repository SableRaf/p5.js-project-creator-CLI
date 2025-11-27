# p5.js Project Creator TUI - Implementation Plan

## Overview

Create a simple, reusable p5.js project creator TUI with an interactive CLI setup script that allows developers to:
- Initialize a new p5.js project from scratch
- Select any p5.js version (semver, latest, or specific version)
- Choose between CDN or local download mode
- Automatically fetch and install matching TypeScript type definitions
- Update versions at any time with the same interactive interface

## Architecture

### Core Approach: Minimal Template + Interactive Setup Script

The simplest approach is a **static template directory** with a **Node.js setup script** that runs interactively when the user first opens the project or wants to change versions.

### Key Components

1. **Static Template Files** - Pre-configured p5.js project structure
2. **Interactive Setup Script** - Node.js CLI using @clack/prompts (beautiful, Charm-inspired TUI)
3. **Version Manager** - Fetches versions from jsdelivr API and updates files
4. **Config File** - Stores current p5.js version and mode preferences
5. **VSCode Integration** - Optional auto-run task on folder open

## Directory Structure

```
p5-project-template/
├── .vscode/
│   ├── tasks.json              # Auto-run setup on folder open (optional)
│   └── settings.json           # Recommended VSCode settings
├── lib/                        # For local p5.js files (when not using CDN)
│   └── .gitkeep
├── types/
│   └── global.d.ts             # p5.js TypeScript definitions
├── index.html                  # Main HTML file (with template script tag)
├── sketch.js                   # Default p5.js sketch
├── style.css                   # Basic CSS styles
├── jsconfig.json               # TypeScript IntelliSense configuration
├── package.json                # npm dependencies and scripts
├── setup.js                    # Interactive CLI setup script
├── p5-config.json              # Stores current version and mode
├── .gitignore                  # Ignores node_modules, etc.
└── README.md                   # Usage instructions
```

## Detailed Component Design

### 1. setup.js - Interactive CLI Script

**Dependencies:**
- `@clack/prompts` - Beautiful, Charm-inspired CLI prompts (v0.11.0+)
- Native fetch - For API calls (Node 18+)

**Features:**
- Fetch available p5.js versions from jsdelivr API
- Present interactive menu with options:
  - Select from recent versions (display last 10-15 versions)
  - Enter custom version (semver or tag like "latest")
  - Choose CDN or Local mode
  - Update existing installation
- Download and update files based on selection
- Validate version exists before applying changes
- Show progress indicators during downloads

**API Endpoints:**
- p5.js versions: `https://data.jsdelivr.com/v1/package/npm/p5`
- Type definitions: `https://data.jsdelivr.com/v1/package/npm/@types/p5`
- Download p5.js: `https://cdn.jsdelivr.net/npm/p5@{version}/lib/p5.js`
- Download types: `https://cdn.jsdelivr.net/npm/p5@{version}/types/global.d.ts`

**Workflow:**
```
1. Read current p5-config.json (if exists)
2. Fetch available versions from jsdelivr API
3. Display interactive menu:
   ┌─────────────────────────────────────┐
   │ p5.js Project Setup                 │
   ├─────────────────────────────────────┤
   │ Current: 2.1.1 (CDN)                │
   │                                     │
   │ What would you like to do?          │
   │ › Change p5.js version              │
   │   Switch between CDN/Local          │
   │   Keep current configuration        │
   └─────────────────────────────────────┘

4. If changing version:
   ┌─────────────────────────────────────┐
   │ Select p5.js version:               │
   │ › 2.1.1 (latest)                    │
   │   2.1.0                             │
   │   2.0.3                             │
   │   2.0.2                             │
   │   ...                               │
   │   Enter custom version              │
   └─────────────────────────────────────┘

5. If changing mode:
   ┌─────────────────────────────────────┐
   │ Choose delivery mode:               │
   │ › CDN (jsdelivr)                    │
   │   Local (download to lib/)          │
   └─────────────────────────────────────┘

6. Download files and update configuration
7. Display success message with next steps
```

### 2. p5-config.json - Configuration File

Stores the current project configuration:

```json
{
  "version": "2.1.1",
  "mode": "cdn",
  "typeDefsVersion": "1.7.7",
  "lastUpdated": "2025-11-27T10:30:00Z"
}
```

### 3. index.html - Template Structure

HTML file with **dynamic script tag** that gets updated by setup.js:

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

The `<!-- P5JS_SCRIPT_TAG -->` comment serves as a marker for setup.js to insert either:
- CDN: `<script src="https://cdn.jsdelivr.net/npm/p5@2.1.1/lib/p5.js"></script>`
- Local: `<script src="lib/p5.js"></script>`

### 4. package.json - npm Scripts

```json
{
  "name": "p5-project",
  "version": "1.0.0",
  "description": "A p5.js project with version management",
  "scripts": {
    "setup": "node setup.js",
    "update": "node setup.js",
    "serve": "npx serve ."
  },
  "dependencies": {},
  "devDependencies": {
    "@clack/prompts": "^0.11.0"
  }
}
```

**Scripts:**
- `npm run setup` / `npm run update`: Run interactive version manager
- `npm run serve`: Start local dev server

### 5. .vscode/tasks.json - Auto-run Setup (Optional)

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "p5.js Setup",
      "type": "shell",
      "command": "npm",
      "args": ["run", "setup"],
      "runOptions": {
        "runOn": "folderOpen"
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    }
  ]
}
```

**Note:** User must enable "Allow Automatic Tasks in Folder" in VSCode for auto-run to work.

### 6. Type Definition Management

**Strategy:**
- Always fetch from jsdelivr: `@types/p5`
- Attempt to match p5.js version exactly
- If no exact match, use latest @types/p5 version
- Save to `types/global.d.ts`
- Update jsconfig.json to include types directory

**Version Matching Logic:**
```javascript
async function getMatchingTypeDefsVersion(p5Version) {
  // Fetch available @types/p5 versions
  const response = await fetch('https://data.jsdelivr.com/v1/package/npm/@types/p5');
  const data = await response.json();

  // Try exact match first
  if (data.versions.includes(p5Version)) {
    return p5Version;
  }

  // Fall back to latest
  return data.tags.latest;
}
```

### 7. Default Template Content

**sketch.js** - Valid p5.js sketch:
```javascript
function setup() {
  createCanvas(400, 400);
  background(220);
}

function draw() {
  circle(mouseX, mouseY, 20);
}
```

**style.css** - Basic styles:
```css
html, body {
  margin: 0;
  padding: 0;
}

canvas {
  display: block;
}
```

**jsconfig.json** - TypeScript IntelliSense:
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

## Implementation Steps

### Phase 1: Core Template Structure
1. Create directory structure with all static files
2. Write default index.html, sketch.js, style.css
3. Create jsconfig.json for IntelliSense
4. Add package.json with dependencies
5. Create .gitignore

### Phase 2: Setup Script Core
1. Implement jsdelivr API fetching functions
2. Create interactive menu with @clack/prompts
3. Implement version selection flow
4. Add configuration read/write to p5-config.json

### Phase 3: File Update Logic
1. Implement HTML script tag replacement
2. Add CDN mode (URL update only)
3. Add Local mode (download + URL update)
4. Implement type definitions download
5. Add error handling and validation

### Phase 4: VSCode Integration
1. Create .vscode/tasks.json for auto-run
2. Add .vscode/settings.json with recommendations
3. Document how to enable automatic tasks

### Phase 5: Polish & Documentation
1. Add progress indicators and better UX
2. Write comprehensive README.md
3. Add example projects/templates
4. Create troubleshooting guide

## Alternative Approaches Considered

### Option A: VSCode Extension
**Pros:** Native VSCode integration, GUI interface, marketplace distribution
**Cons:** Much more complex, requires TypeScript, harder to maintain, overkill for simple task
**Decision:** Too complex for the requirements

### Option B: Yeoman Generator
**Pros:** Established scaffolding tool, familiar to many developers
**Cons:** Additional dependency, less flexible, harder to update existing projects
**Decision:** Doesn't support updating existing projects easily

### Option C: npx Create Script (like create-react-app)
**Pros:** Single command to bootstrap, no git clone needed
**Cons:** Only works for new projects, can't update existing ones
**Decision:** Doesn't meet the "update version" requirement

### Option D: Simple npm Script (Chosen Approach)
**Pros:** Simple, flexible, works for new AND existing projects, easy to customize
**Cons:** Requires git clone or download of template
**Decision:** Best balance of simplicity and functionality

## Trade-offs and Considerations

### CLI Library Choice: @clack/prompts
**Why:** Beautiful Charm-inspired design, actively maintained (v0.11.0, 6 months ago), promise-based, used by 2555+ projects
**Alternative:** @inquirer/prompts (more features), direct Gum binary calls (requires separate install), prompts (simpler)
**Trade-off:** Pure Node.js solution with excellent UX, no external binary dependencies

### CDN vs Local Default
**Default:** CDN mode
**Reasoning:** Simpler for beginners, no file downloads, faster initial setup
**Trade-off:** Requires internet connection, but local mode is one menu away

### Auto-run on Folder Open
**Default:** Optional (user must enable)
**Reasoning:** VSCode security requires user permission, some users may not want auto-run
**Trade-off:** One extra step (allow automatic tasks) but more secure

### Type Definitions Versioning
**Strategy:** Best-effort matching with fallback to latest
**Reasoning:** @types/p5 versions don't always match p5.js versions exactly
**Trade-off:** May occasionally have mismatched types, but better than no types

### Configuration Storage
**Choice:** Separate p5-config.json file
**Alternative:** Store in package.json
**Reasoning:** Clearer separation of concerns, easier to read/edit manually
**Trade-off:** One extra file, but better clarity

## Technical Requirements

### Node.js Version
- **Minimum:** Node.js 18+ (for native fetch API)
- **Recommended:** Node.js 20+ (LTS)

### Dependencies
- **@clack/prompts**: ^0.11.0 (beautiful interactive CLI)
- **No runtime dependencies** - pure p5.js project after setup

### Browser Compatibility
- Modern browsers (ES6+)
- Same compatibility as p5.js itself

## User Experience Flow

### First-time Setup
```
1. Download/clone template
2. Open folder in VSCode
3. (Optional) Allow automatic tasks when prompted
4. Setup script runs automatically OR run `npm install && npm run setup`
5. Interactive menu appears
6. Select version and mode
7. Files are configured
8. Start coding!
```

### Updating Version
```
1. Run `npm run update`
2. Interactive menu shows current config
3. Select new version or change mode
4. Files are updated
5. Refresh browser to see changes
```

## Success Criteria

- [ ] New users can create a p5.js project in under 2 minutes
- [ ] Switching versions takes less than 30 seconds
- [ ] TypeScript IntelliSense works out of the box
- [ ] Works on Windows, macOS, and Linux
- [ ] Clear error messages for network/version issues
- [ ] Can update from any version to any other version
- [ ] Local mode works offline after initial download
- [ ] Documentation is clear and complete

## Future Enhancements (Out of Scope)

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

## Sources & References

**jsdelivr API Documentation:**
- [jsdelivr Data API GitHub](https://github.com/jsdelivr/data.jsdelivr.com)
- [p5 CDN on jsdelivr](https://www.jsdelivr.com/package/npm/p5)
- [@types/p5 CDN on jsdelivr](https://www.jsdelivr.com/package/npm/@types/p5)

**Interactive CLI Libraries:**
- [@clack/prompts npm package](https://www.npmjs.com/package/@clack/prompts)
- [Clack official website](https://www.clack.cc/)
- [Elevate Your CLI Tools with @clack/prompts](https://www.blacksrc.com/blog/elevate-your-cli-tools-with-clack-prompts)
- [Charmbracelet Gum](https://github.com/charmbracelet/gum) (alternative: requires separate install)

**VSCode Task Automation:**
- [VSCode Tasks Documentation](https://code.visualstudio.com/docs/debugtest/tasks)
- [Auto-run Commands on Folder Open](https://frontendmasters.com/blog/vs-code-auto-run-commands/)
- [Stack Overflow: Auto-start Task](https://stackoverflow.com/questions/33464175/vs-code-and-tasks-with-node)
- [Automating Tasks in VSCode](https://www.roboleary.net/vscode/2020/10/19/vscode-task-onstartup)

---

**End of Implementation Plan**
