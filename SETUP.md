# Setup Guide - String Modifier VS Code Extension

This guide will help you set up the development environment and build process for the String Modifier extension.

## Prerequisites

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Visual Studio Code**
- **Git** (optional, for version control)

## Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Install VS Code Extension CLI (optional, for packaging)
```bash
npm install -g @vscode/vsce
```

## Development Workflow

### 1. Compile TypeScript
Before running or packaging the extension, compile the TypeScript code:
```bash
npm run compile
```

### 2. Watch Mode (Recommended for Development)
For automatic compilation during development:
```bash
npm run watch
```
This will automatically recompile when you save changes to `.ts` files.

### 3. Run the Extension
1. Press `F5` in VS Code (or use Run and Debug panel)
2. This opens a new "Extension Development Host" window
3. Your extension will be active in this window
4. Look for the "String Modifier" icon in the Activity Bar

### 4. Reload Extension After Changes
When you make changes:
- Press `Ctrl+Shift+F5` in the Extension Development Host window
- Or use Command Palette: "Developer: Reload Window"

## Building and Packaging

### 1. Build for Production
```bash
npm run compile
```

### 2. Create VSIX Package
```bash
vsce package
```
This creates a `.vsix` file that can be installed or published.

### 3. Install Locally
```bash
code --install-extension string-modifier-0.0.2.vsix
```

## Key Files

- **`package.json`**: Extension manifest with metadata, commands, and scripts
- **`src/extension.ts`**: Main extension code with webview implementation
- **`tsconfig.json`**: TypeScript compiler configuration
- **`media/`**: Contains icons and SVG files used in the UI

## Debugging

### Enable Debug Mode
In `src/extension.ts`, change:
```typescript
const DEBUG = false; // Change to true
```

This will:
- Show debug output in the "String Modifier" output channel
- Display additional logging information

### Debug Console
1. Go to **View** → **Output**
2. Select "String Modifier" from the dropdown
3. View debug messages and errors

## Common Issues

### 1. TypeScript Compilation Errors
```bash
npm run compile
```
Check the output for specific error messages.

### 2. Extension Not Loading
- Make sure you compiled the code (`npm run compile`)
- Check that `out/extension.js` exists
- Verify `package.json` main field points to `"./out/extension.js"`

### 3. Missing Dependencies
```bash
npm install
```

### 4. Icon/Media Not Showing
- Check file paths in `package.json`
- Ensure files exist in `media/` directory
- Verify file extensions match

## Version Management

### Update Version
1. Edit `version` in `package.json`
2. Update `CHANGELOG.md` with changes
3. Follow semantic versioning:
   - **Patch** (0.0.x): Bug fixes
   - **Minor** (0.x.0): New features
   - **Major** (x.0.0): Breaking changes

### Version Workflow
```bash
# 1. Make changes
# 2. Update version in package.json
# 3. Update CHANGELOG.md
# 4. Compile and test
npm run compile
# 5. Package
vsce package
```
