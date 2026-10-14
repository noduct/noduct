<div align="center">

  <img src="public/brand/social-card.svg" alt="Tolvira Banner" width="100%" style="max-width: 820px; border-radius: 8px;" />

  <h1>Tolvira</h1>

  <p>
    <strong>Fast, private, client-side tools for everyday work.</strong><br />
    No accounts, no telemetry, and no servers processing your files.
  </p>

  <p>
    <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-5-18181b?style=flat-square&logo=astro&logoColor=white" alt="Astro 5" /></a>&nbsp;
    <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5-18181b?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>&nbsp;
    <img src="https://img.shields.io/badge/Privacy-First-18181b?style=flat-square" alt="Privacy First" />&nbsp;
    <img src="https://img.shields.io/badge/Auth-No%20Accounts-18181b?style=flat-square" alt="No Accounts" />&nbsp;
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-18181b?style=flat-square" alt="License" /></a>
  </p>

</div>

---

## Overview

Tolvira is a curated collection of browser-based utilities for working with documents, images, text, and structured data.

Unlike conventional web tools that upload user files to remote infrastructure, Tolvira processes all operations locally in the browser using WebAssembly and standard Web APIs. Files and personal data never leave the client device.

## Key Principles

- **Client-Side Execution:** Computation happens entirely on the user's hardware. No files, text, or payloads are transmitted to any server.
- **Zero Friction:** No account creation, subscriptions, paywalls, or usage quotas.
- **Keyboard-First Navigation:** Quick command palette available anywhere via `Ctrl + K` (or `Cmd + K`).
- **Careful Interface:** Designed with high information density, fluid motion, light and dark themes, and full compliance with `prefers-reduced-motion`.
- **Offline & Lightweight:** Built on modern static standards for fast load times and minimal resource footprint.

## Categories

| Category | Scope | Included Tools |
| :--- | :--- | :--- |
| **PDF** | Document manipulation | Merge, Split, Compress, Rotate, Extract, Reorder, PDF to JPG |
| **Image** | Quick graphics processing | Compress, Resize, Crop, Format conversion (WebP, PNG, JPG) |
| **Text** | Copy inspection & formatting | Word & character counters, Case converters, Diff checker, Deduplicator |
| **Data** | Structured data inspection | JSON formatter, CSV viewer, Validator, YAML / XML converter |
| **Developer** | Engineering utilities | Base64, URL encoder, JWT inspector, UUID generator, Regex tester, Hash calculation |
| **General** | Everyday tools | QR code generator, Password generator, Unit and color converters |

## Project Structure

This repository is maintained as an Astro workspace containing the central hub and reusable foundation packages:

```
tolvira/
├── src/                      # Tolvira Hub application (Astro 5)
├── packages/
│   ├── design-system/        # UI components, tokens, and motion curves
│   └── tool-template/        # Template for building standalone micro-apps
└── docs/                     # Design guidelines, architecture, and contracts
```

## Documentation

Setup, development instructions, and architectural specifications are maintained in dedicated reference documents:

- **[Development Guide](DEVELOPMENT.md):** Prerequisites, local environment setup, testing, and build pipelines.
- **[Interface Standards](docs/padroes-interface.md):** Design tokens, typography, motion curves, and micro-app contracts.
- **[Architecture](docs/arquitetura.md):** Monorepo layout, state management, and design decisions.

## License

Distributed under the [MIT License](LICENSE).
