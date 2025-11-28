>[!IMPORTANT]
> This is a proof of concept and is not intended for production use. All of the code and most of the documentation was written by Claude Code. Please take this into consideration when evaluating the project.

# p5.js Project Creator CLI

A beautiful, interactive CLI tool for creating and managing p5.js projects with automatic version management and TypeScript IntelliSense support.

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

#### Switching from Local to CDN

If you switch from Local to CDN mode, the CLI will ask if you want to delete the local copy of p5.js to save space.

## Project Structure

```
.
├── sketch/                       # Your p5.js project folder (will be created by setup.js)
│   ├── index.html                # Main HTML file
│   ├── sketch.js                 # Your p5.js sketch
│   ├── style.css                 # Styles
│   ├── jsconfig.json             # IntelliSense configuration
│   ├── p5-config.json            # Project configuration (auto-generated)
│   └── types/
│       └── p5.js@<version>.d.ts  # TypeScript definitions
├── src/
│   ├── api/
│   │   └── VersionProvider.js    # Fetches versions from jsdelivr
│   ├── config/
│   │   └── ConfigManager.js      # Manages p5-config.json
│   ├── file/
│   │   ├── FileManager.js        # Handles file operations
│   │   └── HTMLManager.js        # Handles HTML manipulation
│   └── ui/
│       └── PromptProvider.js     # Interactive prompts
├── setup.js                      # Setup script entry point
├── package.json
└── README.md
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

Type definitions are automatically downloaded to the `sketch/types/` directory.

This gives you:

- Auto-completion for p5.js functions
- Inline documentation
- Type checking in VS Code

This is defined in `sketch/jsconfig.json` (created automatically on setup).

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

## Requirements

- Node.js 18+ (uses native fetch API)

## License

This project is licensed under the LGPL-2.1 License.

## Credits

- Built with [@clack/prompts](https://www.npmjs.com/package/@clack/prompts)
- p5.js from [p5js.org](https://p5js.org/)
- Official type definitions on jsdelivr: [@types/p5](https://www.jsdelivr.com/package/npm/@types/p5)
- Inspired by the p5.js community and contributors (special thanks to Dave Pagurek and Neill Bogie)
