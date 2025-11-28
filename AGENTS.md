# Agent Guidelines

This document provides guidelines for AI agents (like Claude Code, GitHub Copilot, etc.) working on this project.

## Code Documentation Standards

### JSDoc Requirements

**All functions and methods MUST be documented using JSDoc comments.** This ensures:
- Type-checking support in IDEs
- Better IntelliSense/autocomplete
- Improved code readability
- Self-documenting codebase

#### JSDoc Format

Every function should include:

1. **Description** - Clear explanation of what the function does
2. **@param** tags - For each parameter with type and description
3. **@returns** tag - Return type and description
4. **Additional context** - When helpful (examples, edge cases, etc.)

#### Example

```javascript
/**
 * Downloads TypeScript type definitions for p5.js from jsdelivr CDN.
 * Falls back to the latest version if the specified version's types are not found.
 *
 * @param {string} version - The p5.js version to download type definitions for
 * @param {boolean} [verbose=false] - Whether to log verbose output
 * @returns {Promise<string>} The actual version of the type definitions that were downloaded
 */
async function downloadTypes(version, verbose = false) {
  // Implementation...
}
```

#### Class Methods

Class constructors and methods should follow the same pattern:

```javascript
export class ConfigManager {
  /**
   * Creates a new ConfigManager instance
   * @param {FileManager} fileManager - The file manager instance for file operations
   * @param {string} [configPath='sketch/p5-config.json'] - Path to the configuration file
   */
  constructor(fileManager, configPath = `${basePath}p5-config.json`) {
    this.fileManager = fileManager;
    this.configPath = configPath;
  }

  /**
   * Loads configuration from file
   * @returns {Promise<Object|null>} The configuration object or null if config doesn't exist
   */
  async load() {
    // Implementation...
  }
}
```

## File Organization

The project follows this structure:

```
p5.js-project-creator-CLI/
├── setup.js                    # Main entry point
├── src/
│   ├── api/                   # External API interactions
│   │   └── VersionProvider.js
│   ├── config/                # Configuration management
│   │   └── ConfigManager.js
│   ├── file/                  # File system operations
│   │   ├── FileManager.js
│   │   └── HTMLManager.js
│   └── ui/                    # User interface/prompts
│       └── PromptProvider.js
└── sketch/                    # User's p5.js project (generated)
```

## Maintenance Requirements

### When Adding New Functions

1. Always add complete JSDoc comments before committing
2. Include all @param tags with types
3. Include @returns tag with return type
4. Add description that explains the "why" not just the "what"

### When Modifying Existing Functions

1. Update JSDoc if parameters or return types change
2. Update description if behavior changes significantly
3. Ensure type information stays accurate

### Best Practices

- Use specific types (e.g., `{string}` instead of `{*}`)
- Document optional parameters with square brackets: `@param {string} [verbose=false]`
- For objects, describe the structure: `@returns {Object} Object with {version, mode, typeDefsVersion}`
- For Promises, specify what they resolve to: `@returns {Promise<string[]>}`
- For complex types, consider documenting the structure in detail

## Reference Files

- **HTMLManager.js** - Excellent example of comprehensive JSDoc documentation
- All files in `src/` directory follow consistent JSDoc patterns

## Enforcement

When reviewing code or making changes:
- [ ] Every function has a JSDoc comment block
- [ ] All parameters are documented with @param
- [ ] Return values are documented with @returns
- [ ] Types are specified for all parameters and returns
- [ ] Descriptions are clear and helpful

Keep this file updated as standards evolve.
