# p5.js Project Setup

A beautiful, interactive CLI tool for creating and managing p5.js projects with automatic version management and TypeScript IntelliSense support.

## Features

- 🎨 **Interactive Setup**: Beautiful TUI powered by @clack/prompts
- 📦 **Version Management**: Choose from 155+ p5.js versions via jsdelivr API
- 🚀 **Dual Delivery Modes**: CDN or local file download
- 💡 **TypeScript Support**: Automatic type definitions with IntelliSense
- ⚙️ **Configuration Persistence**: Remembers your choices between runs
- 🏗️ **Clean Architecture**: Modular, testable, extensible codebase

## Quick Start

```bash
# Install dependencies
npm install

# Run setup (first time)
npm run setup

# Update version or mode later
npm run update

# Start local server
npm run serve
```

## Usage

### First-Time Setup

When you run `npm run setup` for the first time, you'll be prompted to:

1. **Select p5.js version**: Choose from the latest 15 versions
2. **Choose delivery mode**:
   - **CDN Mode** (default): Links to jsdelivr CDN
   - **Local Mode**: Downloads p5.js to `lib/` directory

The tool automatically:
- Downloads matching TypeScript type definitions
- Updates `index.html` with the correct script tag
- Saves your configuration to `p5-config.json`

### Updating Configuration

Run `npm run update` anytime to:
- Change the p5.js version
- Switch between CDN and local modes
- Update type definitions

The tool will show your current configuration and ask if you want to change it.

## Project Structure

```
.
├── api/
│   └── VersionProvider.js      # Fetches versions from jsdelivr
├── config/
│   └── ConfigManager.js         # Manages p5-config.json
├── file/
│   └── FileManager.js           # Handles file operations
├── ui/
│   └── PromptProvider.js        # Interactive prompts
├── lib/                         # p5.js files (local mode only)
├── types/
│   └── global.d.ts              # TypeScript definitions
├── index.html                   # Main HTML file
├── sketch.js                    # Your p5.js sketch
├── style.css                    # Styles
├── jsconfig.json                # IntelliSense configuration
├── p5-config.json               # Project configuration
├── setup.js                     # Setup script entry point
└── package.json
```

## Configuration File

`p5-config.json` stores your project settings:

```json
{
  "version": "2.1.1",
  "mode": "cdn",
  "typeDefsVersion": "1.7.7",
  "lastUpdated": "2025-11-27T10:30:00Z"
}
```

## TypeScript IntelliSense

Type definitions are automatically downloaded and configured in `jsconfig.json`. This gives you:

- Auto-completion for p5.js functions
- Inline documentation
- Type checking in VS Code

No additional configuration needed!

## Architecture

This project follows clean architecture principles:

- **Program Against Interfaces**: Each module has a clear contract
- **DRY**: No code duplication, single source of truth
- **Separation of Concerns**: Each layer has one responsibility
  - `api/`: Version fetching and API calls
  - `config/`: Configuration management
  - `file/`: File system operations
  - `ui/`: User interaction prompts

### Extensibility

The modular design makes it easy to:

- Add new version providers (NPM, GitHub, etc.)
- Swap UI frameworks (replace PromptProvider)
- Support different project types (TypeScript, instance mode)
- Add new delivery modes or features

## Development

```bash
# Install dependencies
npm install

# Run setup
node setup.js

# Test with different versions
npm run update
```

## Requirements

- Node.js 18+ (uses native fetch API)

## How It Works

1. **Setup**: Runs `setup.js` which orchestrates the entire process
2. **Version Fetching**: VersionProvider queries jsdelivr API
3. **User Input**: PromptProvider collects version and mode preferences
4. **File Operations**: FileManager updates HTML and downloads files
5. **Type Definitions**: Automatically matches or falls back to latest
6. **Configuration**: ConfigManager saves settings for next time

## CDN vs Local Mode

### CDN Mode (Default)

**Pros:**
- Faster setup
- Smaller project size
- Automatic caching by browsers

**Cons:**
- Requires internet connection
- Subject to CDN availability

**HTML Output:**
```html
<script src="https://cdn.jsdelivr.net/npm/p5@2.1.1/lib/p5.js"></script>
```

### Local Mode

**Pros:**
- Works offline
- Full control over p5.js file
- No external dependencies

**Cons:**
- Larger project size
- Manual updates needed

**HTML Output:**
```html
<script src="lib/p5.js"></script>
```

## Troubleshooting

### Type definitions not found for version X

The tool automatically falls back to the latest @types/p5 version if an exact match isn't found. This is normal and doesn't affect functionality.

### Setup cancelled or failed

Check your internet connection and try again. The tool requires access to:
- `https://data.jsdelivr.com` (version API)
- `https://cdn.jsdelivr.net` (file downloads)

## License

This project template is provided as-is for educational and development purposes.

## Credits

- Built with [@clack/prompts](https://www.npmjs.com/package/@clack/prompts)
- p5.js from [p5js.org](https://p5js.org/)
- Type definitions from [@types/p5](https://www.npmjs.com/package/@types/p5)
