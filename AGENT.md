# AI Agent Guide: DSH Project Icons 🤖

## Project Overview
This project is a specialized plugin for the DeepSeek Harness (DSH) framework. Its primary purpose is to extend the Workspace management system by introducing visual identifiers (icons) and enhancing the workspace list's utility.

## Technical Architecture
- **Core Logic:** Implemented in `index.js` (Host side) and `client.js` (Client side).
- **Configuration:** Uses `cordis.patch.yml` for integration into the DSH ecosystem.
- **Localization:** I18n support via JSON files in `locale/` directory.
- **Entry Point:** `package.json` defines the module exports and DSH-specific bundle configurations.

## Key Components for AI Agents
When modifying or extending this project, focus on the following:

1. **Host Integration (`index.js`):** This is where the server-side logic for managing workspace metadata (like icon paths) resides.
2. **Client Integration (`client.js`):** This handles the rendering of icons in the UI and the interaction with the sidebar.
3. **Patching (`cordis.patch.yml`):** To add new features to the DSH UI or add new tools, you must declare them in the patch file to be correctly injected.
4. **Localization (`locale/*.json`):** Always add new strings to both `ar.json` and `en.json` to maintain bilingual support.

## Development Workflow
1. **Modify Logic** $\rightarrow$ 2. **Update Patch** (if UI/Tools change) $\rightarrow$ 3. **Update Locale** $\rightarrow$ 4. **Verify in DSH GUI**.

## Constraints
- The plugin must follow the DSH bundle structure.
- Client-side code must be compatible with the DSH Web GUI environment.
