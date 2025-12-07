# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WeChat Markdown Editor - a highly simplified WeChat Markdown editor that supports Markdown syntax, custom theme styles, content management, multiple image hosting, AI assistant and other features. The editor renders Markdown documents automatically and instantly into WeChat graphics format.

## Development Commands

```bash
# Development
npm run dev          # Start development server with hot reload
npm start           # Alias for npm run dev

# Building
npm run build       # Build with type checking
npm run build:only  # Build without type checking
npm run build:h5-netlify    # Build for Netlify deployment
npm run build:analyze       # Build with bundle analyzer

# Testing & Quality
npm run lint        # Run ESLint with auto-fix
npm run type-check  # Run TypeScript type checking

# Extensions
npm run ext:dev     # Start Chrome extension development
npm run ext:zip     # Package Chrome extension
npm run firefox:dev # Start Firefox extension development
npm run firefox:zip # Package Firefox extension

# Preview
npm run preview     # Preview production build locally
npm run preview:pages # Preview on Cloudflare Pages
```

## Architecture Overview

### Core Theme System

The application uses a modular theme system located in `src/config/themes/`:

- Each theme is a separate TypeScript file (e.g., `default.ts`, `grace.ts`, `simple.ts`, `typora-ayu.ts`, `mweb-clean.ts`)
- Themes define styles for `base`, `block`, and `inline` elements using CSS-in-JS objects
- The theme system supports CSS custom properties (`--md-primary-color`) for consistent theming
- New themes can inherit from `defaultTheme` using `toMerged()` or be built from scratch

### Renderer Architecture

The Markdown rendering is handled by `src/utils/renderer.ts`:

- Uses `marked` library with custom renderer extensions
- Supports syntax highlighting via `highlight.js`
- Integrates Mermaid diagrams, KaTeX math, GFM alerts, and footnotes
- The `buildTheme()` function merges base styles with theme-specific overrides
- Themes are compiled into inline styles applied to HTML elements

### Store Management

Uses Pinia for state management (`src/stores/index.ts`):

- Main store handles theme selection, editor content, user preferences
- Supports multiple posts/documents with local storage persistence
- CSS editor with multiple scheme tabs for custom styling
- Configuration for fonts, colors, code themes, and layout options

### Component Structure

- `src/components/CodemirrorEditor/` - Main editor interface with CodeMirror integration
- `src/components/ui/` - Reusable UI components built with Radix Vue and Tailwind
- `src/components/ai/` - AI assistant integration for content generation
- Theme-aware components that respond to global theme changes

### Extension Architecture

The project includes browser extensions:

- Chrome extension in `src/extension/` with separate build process
- Uses WebExtensions API for cross-browser compatibility
- Shared components and utilities with main web application

### Build System

- Vite-based build with TypeScript and Vue 3
- UnoCSS for utility-first CSS
- Multiple build targets: web, Chrome extension, Firefox extension
- Environment-specific builds for different deployment platforms

## Key Files for Theme Development

- `src/config/themes/index.ts` - Theme registry and exports
- `src/config/themes/README.md` - Detailed theme development guide
- `src/types/index.ts` - Theme type definitions and interfaces
- `src/utils/renderer.ts` - Theme compilation and rendering logic

## Adding New Themes

1. Create new theme file in `src/config/themes/`
2. Define theme using `Theme` interface with `base`, `block`, and `inline` sections
3. Register theme in `src/config/themes/index.ts` by adding to `themeMap` and `themeOptions`
4. Theme can inherit from `defaultTheme` using `toMerged()` or be standalone
5. Use `--md-primary-color` CSS variable for consistent theming
6. Test theme across different content types (headers, lists, code blocks, etc.)

## Recent Updates

### Mobile Article Management (2025-12-07)

Enhanced mobile user experience with improved article management features:

**New Features:**
- Added quick-access article management button in mobile header (Files icon)
- Positioned to the left of the "Edit" button for easy thumb access
- Opens the article management dialog (draft box) with one tap

**Article Management Dialog Improvements:**
- Added ESC key support to close the dialog
- New expand/collapse all articles functionality
- Improved animation effects for mobile devices
- Optimized dialog layout and styling for better mobile UX

**Key Files Modified:**
- `src/components/CodemirrorEditor/EditorHeader/index.vue` - Mobile header button
- `src/components/CodemirrorEditor/PostSlider/index.vue` - Dialog improvements
- `src/components/CodemirrorEditor/PostSlider/PostItem.vue` - Individual post item enhancements
