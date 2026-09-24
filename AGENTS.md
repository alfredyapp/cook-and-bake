# Repository Guidelines

## What this is

`market-validation-site/` is the Git-tracked market report. `dist/index.html` is the report and course catalogue; `dist/signup.js` powers its shared sign-up dialog. `dist/admin.html` and `dist/admin.js` list and export sign-ups stored on this device. `dist/courses.json` is the catalogue copy; `.openai/hosting.json` identifies the private Sites project. `market-brief.md` is the developer brief. The deployment archive and `market-validation-package-stage/` are generated artifacts.

## Commands

- From the workspace root, run `python -m http.server 8765 --directory market-validation-site/dist` and open `http://localhost:8765/` to preview.
- Edit files under `market-validation-site/dist/` directly; there is no package install, build step, or automated test suite. Check JavaScript with `node --check dist/signup.js` and `node --check dist/admin.js` from the Site checkout.
- Run Git commands from `market-validation-site/`, the only Git checkout in this workspace.

## Conventions

Use semantic HTML, readable CSS, and descriptive link text. Keep navigation and citation IDs stable (for example, `#fees` and `#s1`). Use lowercase, hyphenated IDs and asset names. Before publishing, check source links, numerical claims, browser errors, and mobile and desktop layouts. The one existing commit is `Update Site source`; no broader commit convention is established. Use a short imperative subject and describe evidence or layout changes in pull requests.

## Boundaries

No framework. Do not use Bootstrap. Never put an API key in code. Preserve the Site's invited-viewer access and the no-backend sign-up design (`localStorage` key `cb_signups`). Keep credentials out of commits and do not edit generated deployment artifacts as source. The source catalogue is at `D:\proj\codex\labs\labs\lab-02-plan-and-build-the-site\assets\courses.json`. Cite figures to it or linked public sources; write `UNKNOWN` when a figure cannot be verified.
