# Bug Fix: Robust DOM Parsing for p5.js Script Tag Updates

## Executive Summary

Replace the current marker-based string replacement approach in `updateHTML()` with a robust DOM parsing solution inspired by the [p5.js Web Editor](https://github.com/processing/p5.js-web-editor). This will enable reliable script tag updates across multiple runs, support various CDN providers, handle minified versions, and maintain backward compatibility.

## Problem Description

### Current Issue

The `updateHTML` function in [setup.js:67-86](setup.js#L67-L86) uses simple string replacement that only works with the marker `<!-- P5JS_SCRIPT_TAG -->`. This approach has several critical limitations:

**Evidence of the Bug:**
- Config file: `p5-config.json` shows version `2.0.5`
- HTML file: `index.html` contains version `2.1.0`
- **They're out of sync** because the script tag couldn't be updated

### Current Behavior Problems

1. **Fails on second run**: Marker is replaced with script tag on first run, but no mechanism exists to update the actual script tag
2. **Single CDN only**: Only supports jsdelivr CDN
3. **No minified support**: Cannot handle or preserve `p5.min.js` vs `p5.js` preference
4. **Brittle string matching**: Regex patterns are fragile and don't account for HTML variations
5. **No validation**: Cannot verify if update succeeded

## Root Cause Analysis

The current implementation treats HTML as plain text:

```javascript
const updatedHTML = htmlContent.replace('<!-- P5JS_SCRIPT_TAG -->', scriptTag);
```

**Why this fails:**
- HTML is structured data, not plain text
- Multiple valid ways to write the same HTML (whitespace, attribute order, quotes)
- Cannot detect if script tag was successfully updated
- No way to preserve user preferences (minified, specific CDN)

## Solution Design

### Approach: DOM Parsing (Inspired by p5.js Editor)

The [p5.js Web Editor](https://github.com/processing/p5.js-web-editor) solves this exact problem using DOM parsing. We'll adapt their approach for Node.js.

**Key insight from p5.js Editor code:**
```javascript
// They parse HTML into a proper DOM
const dom = new DOMParser().parseFromString(indexSrc, 'text/html');

// Find script tags using DOM methods
const usedP5Versions = [...dom.documentElement.querySelectorAll('script')]
  .map((scriptNode) => {
    const src = scriptNode.getAttribute('src') || '';
    const matches = [
      /^https?:\/\/cdnjs.cloudflare.com\/ajax\/libs\/p5.js\/(.+)\/p5\.(?:min\.)?js$/,
      /^https?:\/\/cdn.jsdelivr.net\/npm\/p5@(.+)\/lib\/p5\.(min\.)?js$/
    ].map((regex) => regex.exec(src));
    // ...
  });

// Update by modifying DOM node
scriptNode.setAttribute('src', newURL);

// Serialize back to HTML
return dom.documentElement.outerHTML;
```

### Implementation Strategy

#### 1. Choose DOM Parser Library

**Selected: linkedom**

| Feature | linkedom | jsdom |
|---------|----------|-------|
| **Performance** | 3x faster | Baseline |
| **Memory** | 1/3 heap usage | Baseline |
| **Size** | Lightweight | Heavy |
| **Spec Compliance** | Practical subset | 100% compliant |
| **Our Use Case** | ✅ Perfect fit | ⚠️ Overkill |

**Why linkedom:**
- We only need basic DOM operations (find script tags, update attributes, serialize)
- 3x faster and uses 1/3 the memory of jsdom
- No risk of "heap out of memory" issues
- Actively maintained, production-ready
- Used successfully in many projects for similar tasks

**Sources:**
- [linkedom - npm](https://www.npmjs.com/package/linkedom)
- [LinkeDOM: A JSDOM Alternative](https://webreflection.medium.com/linkedom-a-jsdom-alternative-53dd8f699311)
- [GitHub - WebReflection/linkedom](https://github.com/WebReflection/linkedom)

#### 2. Architecture Design

**New Class: HTMLManager**

Create a dedicated class for HTML manipulation to separate concerns:

```
file/
  FileManager.js       (existing - file I/O only)
  HTMLManager.js       (new - DOM operations)
```

**Rationale:**
- Single Responsibility Principle: FileManager handles I/O, HTMLManager handles DOM
- Testability: Can test DOM logic independently
- Reusability: Other parts of codebase can use HTML manipulation
- Maintainability: Clear separation makes code easier to understand

#### 3. Core Algorithm

**Three-stage approach:**

```
Stage 1: Parse HTML → DOM
  ↓
Stage 2: Find & Update p5.js script tag
  ↓
Stage 3: Serialize DOM → HTML
```

**Stage 1: Parse HTML**
```javascript
import { parseHTML } from 'linkedom';
const { document } = parseHTML(htmlString);
```

**Stage 2: Find & Update**
```javascript
// Find all script tags
const scripts = document.querySelectorAll('script');

// Check each script for p5.js patterns
const p5Script = Array.from(scripts).find(script => {
  const src = script.getAttribute('src') || '';
  return P5_PATTERNS.some(regex => regex.test(src));
});

// Update or insert
if (p5Script) {
  p5Script.setAttribute('src', newScriptURL);
} else if (hasMarker) {
  // Replace marker with new script tag
} else {
  // Insert into <head>
}
```

**Stage 3: Serialize**
```javascript
const doctype = '<!DOCTYPE html>\n';
const html = document.documentElement.outerHTML;
return doctype + html;
```

#### 4. Pattern Matching

Support multiple CDN providers and formats (like p5.js Editor does):

```javascript
const P5_PATTERNS = [
  // jsdelivr CDN (current default)
  /^https?:\/\/cdn\.jsdelivr\.net\/npm\/p5@([^/]+)\/lib\/p5\.(min\.)?js$/,

  // cdnjs (popular alternative)
  /^https?:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/p5\.js\/([^/]+)\/p5\.(?:min\.)?js$/,

  // unpkg (another CDN option)
  /^https?:\/\/unpkg\.com\/p5@([^/]+)\/lib\/p5\.(min\.)?js$/,

  // local
  /^lib\/p5\.(min\.)?js$/
];
```

**Capture groups:**
- Group 1: Version number
- Group 2: `min.` if minified (optional)

#### 5. Preserve User Preferences

Respect user's existing choices:

```javascript
function detectPreferences(scriptSrc) {
  const isMinified = /p5\.min\.js/.test(scriptSrc);
  const cdnProvider =
    /cdn\.jsdelivr\.net/.test(scriptSrc) ? 'jsdelivr' :
    /cdnjs\.cloudflare\.com/.test(scriptSrc) ? 'cdnjs' :
    /unpkg\.com/.test(scriptSrc) ? 'unpkg' :
    'local';

  return { isMinified, cdnProvider };
}

function buildScriptURL(version, mode, preferences) {
  const file = preferences.isMinified ? 'p5.min.js' : 'p5.js';

  if (mode === 'local') {
    return `lib/${file}`;
  }

  // Preserve CDN choice (or default to jsdelivr)
  const cdn = preferences.cdnProvider || 'jsdelivr';

  switch(cdn) {
    case 'jsdelivr':
      return `https://cdn.jsdelivr.net/npm/p5@${version}/lib/${file}`;
    case 'cdnjs':
      return `https://cdnjs.cloudflare.com/ajax/libs/p5.js/${version}/${file}`;
    case 'unpkg':
      return `https://unpkg.com/p5@${version}/lib/${file}`;
    default:
      return `https://cdn.jsdelivr.net/npm/p5@${version}/lib/${file}`;
  }
}
```

#### 6. Backward Compatibility

Support marker-based templates:

```javascript
// Check for marker comment
const walker = document.createTreeWalker(
  document.head,
  NodeFilter.SHOW_COMMENT
);

let markerNode = null;
while (walker.nextNode()) {
  if (walker.currentNode.textContent.trim() === 'P5JS_SCRIPT_TAG') {
    markerNode = walker.currentNode;
    break;
  }
}

if (markerNode) {
  // Replace marker with script element
  const script = document.createElement('script');
  script.setAttribute('src', scriptURL);
  markerNode.parentNode.replaceChild(script, markerNode);
}
```

## Implementation Plan

### Phase 1: Setup (5 minutes)

**File**: [package.json](package.json)

Add linkedom dependency:
```json
{
  "devDependencies": {
    "@clack/prompts": "^0.11.0",
    "linkedom": "^0.18.0"
  }
}
```

**Command**: `npm install --save-dev linkedom`

### Phase 2: Create HTMLManager (20 minutes)

**File**: `file/HTMLManager.js` (NEW)

```javascript
// HTMLManager - Handles HTML DOM manipulation using linkedom
import { parseHTML } from 'linkedom';

export class HTMLManager {
  /**
   * CDN URL patterns for p5.js
   */
  static P5_PATTERNS = [
    /^https?:\/\/cdn\.jsdelivr\.net\/npm\/p5@([^/]+)\/lib\/p5\.(min\.)?js$/,
    /^https?:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/p5\.js\/([^/]+)\/p5\.(?:min\.)?js$/,
    /^https?:\/\/unpkg\.com\/p5@([^/]+)\/lib\/p5\.(min\.)?js$/,
    /^lib\/p5\.(min\.)?js$/
  ];

  /**
   * Find p5.js script tag in document
   * @param {Document} document - linkedom document
   * @returns {{ scriptNode: Element, version: string, isMinified: boolean, cdnProvider: string } | null}
   */
  findP5Script(document) {
    const scripts = document.querySelectorAll('script');

    for (const script of scripts) {
      const src = script.getAttribute('src') || '';

      for (const pattern of HTMLManager.P5_PATTERNS) {
        const match = pattern.exec(src);
        if (match) {
          return {
            scriptNode: script,
            version: match[1] || 'local',
            isMinified: !!match[2],
            cdnProvider: this.detectCDN(src)
          };
        }
      }
    }

    return null;
  }

  /**
   * Detect CDN provider from URL
   */
  detectCDN(url) {
    if (/cdn\.jsdelivr\.net/.test(url)) return 'jsdelivr';
    if (/cdnjs\.cloudflare\.com/.test(url)) return 'cdnjs';
    if (/unpkg\.com/.test(url)) return 'unpkg';
    return 'jsdelivr'; // default
  }

  /**
   * Build script URL based on version, mode, and preferences
   */
  buildScriptURL(version, mode, preferences = {}) {
    const file = preferences.isMinified ? 'p5.min.js' : 'p5.js';

    if (mode === 'local') {
      return `lib/${file}`;
    }

    const cdn = preferences.cdnProvider || 'jsdelivr';

    switch(cdn) {
      case 'jsdelivr':
        return `https://cdn.jsdelivr.net/npm/p5@${version}/lib/${file}`;
      case 'cdnjs':
        return `https://cdnjs.cloudflare.com/ajax/libs/p5.js/${version}/${file}`;
      case 'unpkg':
        return `https://unpkg.com/p5@${version}/lib/${file}`;
      default:
        return `https://cdn.jsdelivr.net/npm/p5@${version}/lib/${file}`;
    }
  }

  /**
   * Find marker comment in head
   */
  findMarker(document) {
    const walker = document.createTreeWalker(
      document.head,
      NodeFilter.SHOW_COMMENT
    );

    while (walker.nextNode()) {
      if (walker.currentNode.textContent.trim() === 'P5JS_SCRIPT_TAG') {
        return walker.currentNode;
      }
    }

    return null;
  }

  /**
   * Update p5.js script tag in HTML
   * @param {string} htmlString - HTML content
   * @param {string} version - p5.js version
   * @param {string} mode - 'cdn' or 'local'
   * @returns {{ html: string, updated: boolean, method: string }}
   */
  updateP5Script(htmlString, version, mode) {
    // Parse HTML
    const { document } = parseHTML(htmlString);

    // Try to find existing p5.js script
    const p5Info = this.findP5Script(document);

    if (p5Info) {
      // Update existing script tag
      const newURL = this.buildScriptURL(version, mode, {
        isMinified: p5Info.isMinified,
        cdnProvider: mode === 'cdn' ? p5Info.cdnProvider : undefined
      });

      p5Info.scriptNode.setAttribute('src', newURL);

      return {
        html: this.serialize(document),
        updated: true,
        method: 'updated-existing-script'
      };
    }

    // Try to find marker
    const marker = this.findMarker(document);

    if (marker) {
      // Replace marker with script tag
      const script = document.createElement('script');
      const newURL = this.buildScriptURL(version, mode);
      script.setAttribute('src', newURL);
      marker.parentNode.replaceChild(script, marker);

      return {
        html: this.serialize(document),
        updated: true,
        method: 'replaced-marker'
      };
    }

    // No script tag and no marker - insert into head
    const script = document.createElement('script');
    const newURL = this.buildScriptURL(version, mode);
    script.setAttribute('src', newURL);

    // Insert as first child of head (before meta, link, etc.)
    const firstChild = document.head.firstChild;
    if (firstChild) {
      document.head.insertBefore(script, firstChild);
    } else {
      document.head.appendChild(script);
    }

    return {
      html: this.serialize(document),
      updated: true,
      method: 'inserted-new-script'
    };
  }

  /**
   * Serialize document back to HTML string
   */
  serialize(document) {
    const doctype = '<!DOCTYPE html>\n';
    const html = document.documentElement.outerHTML;
    return doctype + html;
  }
}
```

### Phase 3: Update setup.js (10 minutes)

**File**: [setup.js](setup.js)

**Step 3a**: Import HTMLManager (add to imports at top)
```javascript
import { HTMLManager } from './file/HTMLManager.js';
```

**Step 3b**: Create instance (add after existing managers)
```javascript
const htmlManager = new HTMLManager();
```

**Step 3c**: Replace `updateHTML` function (lines 67-86)

**OLD CODE:**
```javascript
async function updateHTML(version, mode) {
  // Read index.html
  const htmlContent = await fileManager.readHTML();

  // Create script tag based on mode
  let scriptTag;
  if (mode === 'cdn') {
    scriptTag = `<script src="https://cdn.jsdelivr.net/npm/p5@${version}/lib/p5.js"></script>`;
  } else {
    scriptTag = `<script src="lib/p5.js"></script>`;
  }

  // Replace marker with script tag
  const updatedHTML = htmlContent.replace('<!-- P5JS_SCRIPT_TAG -->', scriptTag);

  // Write back to file
  await fileManager.writeHTML('index.html', updatedHTML);

  console.log(`✓ Updated index.html with p5.js ${version} (${mode} mode)`);
}
```

**NEW CODE:**
```javascript
async function updateHTML(version, mode) {
  // Read index.html
  const htmlContent = await fileManager.readHTML();

  // Update p5.js script tag using DOM parsing
  const result = htmlManager.updateP5Script(htmlContent, version, mode);

  // Write back to file
  await fileManager.writeHTML('index.html', result.html);

  if (result.updated) {
    console.log(`✓ Updated index.html with p5.js ${version} (${mode} mode)`);
    console.log(`  Method: ${result.method}`);
  } else {
    console.warn('⚠ Warning: Could not update index.html');
  }
}
```

### Phase 4: Testing (15 minutes)

Create test scenarios in a test file or manually verify:

**Test Case 1: Update existing jsdelivr script**
```html
<!-- Before -->
<script src="https://cdn.jsdelivr.net/npm/p5@2.1.0/lib/p5.js"></script>

<!-- After running setup with version 2.0.5 -->
<script src="https://cdn.jsdelivr.net/npm/p5@2.0.5/lib/p5.js"></script>
```
✅ Should update version while preserving jsdelivr CDN

**Test Case 2: Preserve minified preference**
```html
<!-- Before -->
<script src="https://cdn.jsdelivr.net/npm/p5@2.1.0/lib/p5.min.js"></script>

<!-- After running setup with version 2.0.5 -->
<script src="https://cdn.jsdelivr.net/npm/p5@2.0.5/lib/p5.min.js"></script>
```
✅ Should preserve .min.js

**Test Case 3: Respect different CDN (cdnjs)**
```html
<!-- Before -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/2.1.0/p5.js"></script>

<!-- After running setup with version 2.0.5 in CDN mode -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/2.0.5/p5.js"></script>
```
✅ Should keep cdnjs provider

**Test Case 4: Switch from CDN to local**
```html
<!-- Before -->
<script src="https://cdn.jsdelivr.net/npm/p5@2.1.0/lib/p5.js"></script>

<!-- After running setup with local mode -->
<script src="lib/p5.js"></script>
```
✅ Should switch to local path

**Test Case 5: Switch from local to CDN**
```html
<!-- Before -->
<script src="lib/p5.js"></script>

<!-- After running setup with version 2.0.5 in CDN mode -->
<script src="https://cdn.jsdelivr.net/npm/p5@2.0.5/lib/p5.js"></script>
```
✅ Should switch to CDN (jsdelivr by default)

**Test Case 6: Backward compatibility with marker**
```html
<!-- Before -->
<!-- P5JS_SCRIPT_TAG -->

<!-- After running setup with version 2.0.5 -->
<script src="https://cdn.jsdelivr.net/npm/p5@2.0.5/lib/p5.js"></script>
```
✅ Should replace marker

**Test Case 7: HTML with no script and no marker**
```html
<!-- Before -->
<head>
  <meta charset="utf-8">
</head>

<!-- After running setup -->
<head>
  <script src="https://cdn.jsdelivr.net/npm/p5@2.0.5/lib/p5.js"></script>
  <meta charset="utf-8">
</head>
```
✅ Should insert script as first child

### Phase 5: Documentation (5 minutes)

Update README or add comments explaining:
- DOM parsing approach
- Supported CDN providers
- How preferences are preserved

## Benefits

### 1. Robustness
- ✅ Works on first run, second run, and all subsequent runs
- ✅ Handles any valid HTML structure
- ✅ Not affected by whitespace or attribute order variations

### 2. Flexibility
- ✅ Supports multiple CDN providers (jsdelivr, cdnjs, unpkg)
- ✅ Preserves user's minified preference
- ✅ Can switch between CDN and local modes

### 3. Reliability
- ✅ Config and HTML stay synchronized
- ✅ Clear feedback on what operation was performed
- ✅ No silent failures

### 4. Maintainability
- ✅ Clean separation of concerns (FileManager vs HTMLManager)
- ✅ Easy to test DOM logic independently
- ✅ Based on proven approach from p5.js Editor

### 5. Backward Compatibility
- ✅ Still works with marker-based templates
- ✅ No breaking changes to existing workflows
- ✅ Graceful handling of edge cases

## Risk Analysis

### Risk 1: linkedom Dependency
**Risk**: Adding new dependency increases bundle size and potential security surface

**Mitigation**:
- linkedom is lightweight (much smaller than jsdom)
- Actively maintained with good security track record
- Only used in dev/setup script, not in production code
- Can easily swap for different parser if needed (interface-based design)

**Likelihood**: Low
**Impact**: Low
**Overall**: ✅ Acceptable

### Risk 2: linkedom Compatibility Issues
**Risk**: linkedom might not fully support all HTML/DOM features

**Mitigation**:
- We only use basic DOM features (querySelectorAll, getAttribute, setAttribute)
- These are well-supported in linkedom
- Tested in many production projects
- Fallback logic in place

**Likelihood**: Very Low
**Impact**: Low
**Overall**: ✅ Acceptable

### Risk 3: Breaking Existing HTML Files
**Risk**: DOM parsing might change HTML structure or formatting

**Mitigation**:
- linkedom preserves HTML structure well
- Only modifies the specific script tag
- Test cases cover various HTML structures
- Backward compatibility with markers ensures old templates work

**Likelihood**: Low
**Impact**: Medium
**Overall**: ✅ Acceptable (mitigated by testing)

### Risk 4: Performance Impact
**Risk**: DOM parsing might be slower than string replacement

**Mitigation**:
- Setup script only runs when user explicitly calls it (not in hot path)
- linkedom is 3x faster than jsdom
- Parsing a small index.html file is negligible (<10ms)
- User won't notice difference

**Likelihood**: N/A
**Impact**: None
**Overall**: ✅ Not a concern

## Alternative Approaches Considered

### Alternative 1: Enhanced Regex (original FIXES.md proposal)
**Pros**:
- No new dependency
- Simple to implement

**Cons**:
- Brittle - fails on HTML variations (whitespace, quotes, attribute order)
- Cannot preserve user preferences reliably
- Hard to maintain as edge cases grow
- Doesn't handle multiple p5 script tags
- **Still fundamentally treating HTML as text**

**Decision**: ❌ Rejected - Not robust enough

### Alternative 2: Full jsdom
**Pros**:
- 100% spec compliant
- Most popular choice

**Cons**:
- Heavy dependency (3x slower, 3x memory)
- Overkill for our use case
- Risk of heap issues on large HTML
- Slower setup experience

**Decision**: ❌ Rejected - Unnecessary overhead

### Alternative 3: Custom HTML Parser
**Pros**:
- No dependency
- Full control

**Cons**:
- Reinventing the wheel
- High development cost
- Bug-prone (HTML parsing is complex)
- Maintenance burden
- Not battle-tested

**Decision**: ❌ Rejected - Not pragmatic

### Alternative 4: AST-based Parser (like parse5)
**Pros**:
- Lightweight
- Standards-compliant

**Cons**:
- Lower-level API (work with AST nodes, not DOM)
- More complex code
- Less intuitive than DOM API
- No significant advantage over linkedom

**Decision**: ❌ Rejected - DOM API is more intuitive

## Success Criteria

### Functional Requirements
- ✅ Running `npm run setup` successfully updates index.html
- ✅ Config version and HTML version stay synchronized
- ✅ Works with marker-based templates (backward compatible)
- ✅ Works with existing script tags (all CDN providers)
- ✅ Preserves minified preference
- ✅ Can switch between CDN and local modes

### Non-Functional Requirements
- ✅ Setup completes in under 5 seconds (performance)
- ✅ No breaking changes to existing workflows (compatibility)
- ✅ Clear console output explaining what happened (usability)
- ✅ Code is maintainable and well-documented (maintainability)

### Test Coverage
- ✅ All 7 test cases pass
- ✅ Edge cases handled gracefully
- ✅ No regression in existing functionality

## Implementation Checklist

### Setup Phase
- [ ] Install linkedom: `npm install --save-dev linkedom`
- [ ] Verify installation: `node -e "import('linkedom').then(console.log)"`

### Development Phase
- [ ] Create `file/HTMLManager.js`
- [ ] Implement `findP5Script()` method
- [ ] Implement `detectCDN()` method
- [ ] Implement `buildScriptURL()` method
- [ ] Implement `findMarker()` method
- [ ] Implement `updateP5Script()` method
- [ ] Implement `serialize()` method
- [ ] Add JSDoc comments to all methods

### Integration Phase
- [ ] Import HTMLManager in setup.js
- [ ] Create htmlManager instance
- [ ] Update `updateHTML()` function
- [ ] Add enhanced console logging

### Testing Phase
- [ ] Test Case 1: Update existing jsdelivr script ✓
- [ ] Test Case 2: Preserve minified preference ✓
- [ ] Test Case 3: Respect different CDN (cdnjs) ✓
- [ ] Test Case 4: Switch from CDN to local ✓
- [ ] Test Case 5: Switch from local to CDN ✓
- [ ] Test Case 6: Backward compatibility with marker ✓
- [ ] Test Case 7: HTML with no script and no marker ✓

### Validation Phase
- [ ] Verify config and HTML stay in sync
- [ ] Test with real p5.js project
- [ ] Check console output is clear and helpful
- [ ] Verify no breaking changes

### Documentation Phase
- [ ] Update README with DOM parsing approach
- [ ] Document supported CDN providers
- [ ] Add troubleshooting guide
- [ ] Update inline code comments

## Timeline Estimate

- **Phase 1 (Setup)**: 5 minutes
- **Phase 2 (HTMLManager)**: 20 minutes
- **Phase 3 (Integration)**: 10 minutes
- **Phase 4 (Testing)**: 15 minutes
- **Phase 5 (Documentation)**: 5 minutes

**Total**: ~55 minutes

## References

### Inspiration
- [p5.js Web Editor - useP5Version.jsx](https://github.com/processing/p5.js-web-editor) - Original DOM parsing approach

### Libraries
- [linkedom - npm](https://www.npmjs.com/package/linkedom)
- [LinkeDOM: A JSDOM Alternative](https://webreflection.medium.com/linkedom-a-jsdom-alternative-53dd8f699311)
- [GitHub - WebReflection/linkedom](https://github.com/WebReflection/linkedom)

### Performance Comparisons
- [Using LinkeDOM as test environment in Jest unit tests](https://hmh.engineering/using-linkedom-as-test-environment-in-jest-unit-tests-ec4a7659c8d6)
- [The 5 Best NodeJS HTML Parsing Libraries Compared](https://scrapeops.io/nodejs-web-scraping-playbook/best-nodejs-html-parsing-libraries/)

---

**Plan Status**: Ready for review and approval
**Last Updated**: 2025-11-27
**Author**: Claude Code (Plan Mode)
