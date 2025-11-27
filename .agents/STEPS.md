# Incremental Development Plan for p5.js Project Creator TUI

**Goal**: Build a CLI tool that helps developers set up p5.js projects with proper TypeScript support and version management.

**Approach**: Start with the absolute minimum working version, then add features in logical, testable chunks.

---

## Stage 1: Proof of Concept (PoC)
**Goal**: Demonstrate core functionality with hardcoded values

### Commit 1: Project skeleton
```bash
# What: Basic file structure
- package.json with dependencies
- Empty setup.js
- Basic index.html template
```

### Commit 2: Hardcoded HTML update
```bash
# What: Replace marker in HTML with CDN script tag
- Read index.html
- Replace <!-- P5JS_SCRIPT_TAG --> with hardcoded p5.js CDN link
- Write file back
- Verify it works manually
```

### Commit 3: Basic prompt
```bash
# What: Single interactive prompt
- Install @clack/prompts
- Ask user one question: "Ready to setup? (y/n)"
- Run the HTML update from commit 2
- Show success message
```

**Checkpoint**: You can run `node setup.js`, answer y, and see HTML updated. **Ship it.**

---

## Stage 2: Real Version Selection
**Goal**: Let users actually choose p5.js versions

### Commit 4: Fetch versions from jsdelivr
```bash
# What: Get real version data
- Fetch from jsdelivr API
- Parse JSON response
- Log versions to console (no UI yet)
```

### Commit 5: Version selection prompt
```bash
# What: User can select from real versions
- Pass version list to @clack/prompts
- Let user choose
- Update HTML with selected version
```

**Checkpoint**: Users can pick a real p5.js version. **Ship it.**

---

## Stage 3: Configuration Persistence
**Goal**: Remember user choices between runs

### Commit 6: Read/write config file
```bash
# What: Save selections to p5-config.json
- Create config file after setup
- Store: version, mode (always "cdn" for now), timestamp
```

### Commit 7: Load existing config
```bash
# What: Show current settings on startup
- Check if p5-config.json exists
- Display current version
- Ask if user wants to change it
```

**Checkpoint**: Config persists. Second run shows current version. **Ship it.**

---

## Stage 4: Local Mode
**Goal**: Support downloading p5.js locally

### Commit 8: Download p5.js file
```bash
# What: Fetch p5.js and save to lib/
- Create lib/ directory
- Download from jsdelivr CDN
- Save as lib/p5.js
```

### Commit 9: Mode selection
```bash
# What: CDN vs Local choice
- Add mode prompt (CDN/Local)
- Update HTML script tag based on choice:
  - CDN: <script src="https://...">
  - Local: <script src="lib/p5.js">
- Save mode to config
```

**Checkpoint**: Users can choose local mode. **Ship it.**

---

## Stage 5: TypeScript Support
**Goal**: Add IntelliSense for p5.js

### Commit 10: Download type definitions
```bash
# What: Fetch @types/p5 from jsdelivr
- Download index.d.ts
- Save to types/global.d.ts
- Create jsconfig.json if missing
```

### Commit 11: Version matching
```bash
# What: Match types to p5.js version
- Try to fetch types for selected version
- Fallback to latest if not found
- Store typeDefsVersion in config
```

**Checkpoint**: VSCode IntelliSense works. **Ship it.**

---

## Stage 6: Refactor to Interfaces (DRY)
**Goal**: Clean up code, remove duplication

### Commit 12: Extract file operations
```bash
# What: Create FileManager class
- Move all fs operations to one place
- Methods: readHTML, writeHTML, createDir, downloadFile
- Update setup.js to use FileManager
```

### Commit 13: Extract API calls
```bash
# What: Create VersionProvider class
- Move fetch logic
- Methods: getVersions, getLatest, downloadFile
- Update setup.js to use VersionProvider
```

### Commit 14: Extract config operations
```bash
# What: Create ConfigManager class
- Move config read/write
- Methods: load, save, getDefault
- Update setup.js to use ConfigManager
```

### Commit 15: Extract prompts
```bash
# What: Create PromptProvider class
- Wrap @clack/prompts
- Methods: selectVersion, selectMode, confirm
- Update setup.js to use PromptProvider
```

**Checkpoint**: Code is modular, testable, no duplication. **Ship it.**

---

## Stage 7: Error Handling & Polish
**Goal**: Handle edge cases gracefully

### Commit 16: Add validation
```bash
# What: Validate user inputs
- Check version exists before downloading
- Validate file paths are writable
- Show helpful error messages
```

### Commit 17: Add retry logic
```bash
# What: Retry failed network requests
- Wrap fetch in retry function (3 attempts)
- Show progress during downloads
```

### Commit 18: Improve UX
```bash
# What: Better messages and formatting
- Add spinners for slow operations
- Color-code success/error messages
- Add "What's next?" hints after setup
```

**Checkpoint**: Production-ready UX. **Ship it.**

---

## Stage 8: Documentation & Templates
**Goal**: Complete project template

### Commit 19: Add example sketch
```bash
# What: Include sketch.js and style.css
- Basic p5.js sketch that works
- Simple CSS styling
```

### Commit 20: Add README
```bash
# What: Document usage
- How to setup
- How to update version
- How to run locally
```

**Checkpoint**: Full template ready to use. **Ship it.**

---

## Development Best Practices for This Project

### 1. **Test After Each Commit**
```bash
# Before committing:
$ node setup.js  # Does it run?
$ npm run serve  # Does the HTML work?
```

### 2. **Commit Messages**
```bash
git commit -m "feat: add version selection from jsdelivr API"
git commit -m "refactor: extract file operations to FileManager"
git commit -m "fix: handle missing config file on first run"
```

### 3. **Keep Main Setup.js Small**
By Stage 6, your `setup.js` should look like:
```javascript
async function main() {
  const config = await configManager.load();
  const versions = await versionProvider.getVersions();
  const selected = await promptProvider.selectVersion(versions);
  await fileManager.updateHTML(selected);
  await configManager.save(config);
}
```

### 4. **Don't Gold-Plate**
- Stage 1-3: Ugly but working > Beautiful but incomplete
- Stage 4-5: Add real features
- Stage 6: Make it maintainable
- Stage 7-8: Polish

### 5. **Checkpoints = Demo-able**
After each stage, you should be able to demo to someone:
- "Look, it updates the HTML"
- "Look, you can pick versions now"
- "Look, it remembers your choice"

### 6. **One Thing Breaks? Fix, Don't Add**
If commit 10 breaks commit 5, **stop adding features**. Fix it first.

---

## Red Flags to Watch For

🚩 **"While I'm here..."** → Save it for later  
🚩 **Commit touches 10+ files** → Break it down  
🚩 **"Almost done with Stage 1"** (day 3) → You're over-engineering  
🚩 **No demo after 5 commits** → Your increments are too small or broken  

---

## Success Metrics Per Stage

- **Stage 1**: Demo in 2 hours, 3 commits
- **Stage 2**: Demo in 1 hour, 2 commits  
- **Stage 3**: Demo in 1 hour, 2 commits
- **Stage 4**: Demo in 1.5 hours, 2 commits
- **Stage 5**: Demo in 1.5 hours, 2 commits
- **Stage 6**: Refactor over 4 commits, 4 hours (no new features)
- **Stage 7**: Polish over 3 commits, 2 hours
- **Stage 8**: Documentation, 2 commits, 1 hour

**Total: ~14 hours of focused work across 20 commits**

---

## The Golden Rule Applied Here

1. **Make it work**: Stages 1-5 (hardcode, hack, whatever)
2. **Make it right**: Stage 6 (refactor to interfaces, DRY)
3. **Make it fast**: Stage 7 (retry, validation, caching)

Good luck! Start with Stage 1, Commit 1. Make that HTML update work. Everything else builds from there.