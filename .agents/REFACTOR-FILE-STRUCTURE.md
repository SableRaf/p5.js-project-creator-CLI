# Incremental Refactor Plan: Project Structure Cleanup

## Stage 1: Move p5.js Project Files to `sketch/`
**Goal**: All p5.js files and version-specific types are in `sketch/` folder.

**What**: Move `index.html`, `sketch.js`, `style.css`, `jsconfig.json`, `p5-config.json` to `sketch/`.
- Create `sketch/` folder.
- Move files listed above.
- Update any references in scripts or configs.

**What**: Relocate `types/` folder to `sketch/`.
- Move `types/` into `sketch/`.
- Update references in codebase.

**What**: Move `api/`, `config/`, `file/`, `ui/` to `src/`.
- Create `src/` folder.
- Move all source folders.
- Update import paths in codebase.


**Checkpoint**: All p5.js and types files are in `sketch/`. Documentation and source code are organized in their respective folders. **Ship it.**
**Time**: 1 hour, 2 commits

---

## Stage 4: Update Imports, References, and Documentation
**Goal**: All code and docs reflect new structure.

### Commit 1: Update all import paths and references
**What**: Refactor codebase to use new folder structure in imports and file references.
- In `setup.js`, update imports to use `src/`:
  - `import { FileManager } from './src/file/FileManager.js';`
  - `import { HTMLManager } from './src/file/HTMLManager.js';`
  - `import { VersionProvider } from './src/api/VersionProvider.js';`
  - `import { ConfigManager } from './src/config/ConfigManager.js';`
  - `import { PromptProvider } from './src/ui/PromptProvider.js';`
- In `scripts/dry-run.js`, update:
  - `import { FileManager } from '../src/file/FileManager.js';`

- In `scripts/setup.js`, update imports and references to files we moved to `sketch/` or `src/`.

### Commit 2: Update README and relevant docs
**What**: Document new structure and setup instructions.

**Checkpoint**: Project runs and is documented with new structure. **Ship it.**
**Time**: 1 hour, 2 commits

---

## Development Best Practices

1. **Test After Each Commit**: Run project and setup script after every commit.
2. **Commit Message Format**: Use clear, single-purpose commit messages (see AGENTS.md).
3. **Keep Main Files Simple**: Only essential files at root.
4. **One Thing Breaks? Stop and Fix**: Fix regressions before continuing.
5. **Don't Add While Refactoring**: Refactor only after features work.

---

## Iteration Workflows

- Use mini-plans for bugs and enhancements as described in AGENTS.md.
- Always break down large changes into atomic, testable commits.
- Document all changes and checkpoints.