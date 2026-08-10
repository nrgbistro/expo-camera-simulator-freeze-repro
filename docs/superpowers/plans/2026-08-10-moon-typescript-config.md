# Moon and TypeScript Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove editor dependence on Expo's package-provided TypeScript base config and provide working Moon tasks for production iOS export, the Expo dev server, and typechecking.

**Architecture:** Keep `package.json` scripts as the command source of truth. Configure the repository root as Moon project `app`, with Moon delegating to the pnpm scripts, while `tsconfig.json` directly contains the Expo 57 compiler settings required by editors and the TypeScript CLI.

**Tech Stack:** Expo 57.0.9, TypeScript 6.0.3, pnpm 11.9.0, Moon 2.3.4, Proto

## Global Constraints

- `build` must create a production iOS export in `dist/`.
- `dev` must run the interactive Expo development server.
- The TypeScript configuration must not extend `expo/tsconfig.base`.
- Preserve the pinned Expo and expo-camera versions used by the reproduction.
- Do not modify the Platform worktree or the camera reproduction behavior.

---

### Task 1: Make the TypeScript configuration self-contained

**Files:**
- Modify: `tsconfig.json`

**Interfaces:**
- Consumes: Expo 57's compiler options from the installed `expo/tsconfig.base.json`.
- Produces: A standalone TypeScript project configuration with `jsx: react-jsx`, strict checking, bundler module resolution, and generated-directory exclusions.

- [ ] **Step 1: Run a failing self-contained-config assertion**

Run:

```bash
node -e "const c=require('./tsconfig.json'); if(c.extends || c.compilerOptions.jsx !== 'react-jsx') process.exit(1)"
```

Expected: exit 1 because the current config has `extends` and no direct `jsx` option.

- [ ] **Step 2: Replace the inherited config with explicit Expo 57 options**

Set `tsconfig.json` to:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "allowJs": true,
    "customConditions": ["react-native"],
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "lib": ["DOM", "ESNext"],
    "module": "preserve",
    "moduleDetection": "force",
    "moduleResolution": "bundler",
    "noEmit": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ESNext"
  },
  "exclude": ["node_modules", "android", "ios", "dist"]
}
```

- [ ] **Step 3: Verify the assertion and TypeScript compilation**

Run:

```bash
node -e "const c=require('./tsconfig.json'); if(c.extends || c.compilerOptions.jsx !== 'react-jsx') process.exit(1)"
pnpm run typecheck
pnpm exec tsc --showConfig
```

Expected: all commands exit 0; the effective configuration includes `jsx: react-jsx` and no `extends` property.

- [ ] **Step 4: Commit the TypeScript fix**

```bash
git add tsconfig.json
git commit -m "Fix standalone TypeScript configuration"
```

### Task 2: Add the standalone Moon workspace and tasks

**Files:**
- Modify: `.gitignore`
- Modify: `.prototools`
- Modify: `package.json`
- Create: `.moon/workspace.yaml`
- Create: `moon.yaml`
- Modify: `README.md`

**Interfaces:**
- Consumes: Existing pnpm `start` and `typecheck` scripts and the new pnpm `build` script.
- Produces: `moon run app:build`, `moon run app:dev`, and `moon run app:typecheck`.

- [ ] **Step 1: Verify Moon currently cannot discover the workspace**

Run:

```bash
moon query tasks
```

Expected: non-zero exit because Moon is not pinned and the repository has no `.moon` workspace folder.

- [ ] **Step 2: Pin Moon and add the package build script**

Add this tool pin to `.prototools`:

```toml
moon = "2.3.4"
```

Add this script to `package.json` before `ios`:

```json
"build": "expo export --platform ios --output-dir dist"
```

- [ ] **Step 3: Create the Moon workspace and project task configuration**

Create `.moon/workspace.yaml`:

```yaml
projects:
  app: '.'
```

Create `moon.yaml`:

```yaml
language: 'typescript'

tasks:
  build:
    command: 'pnpm'
    args: ['run', 'build']
    outputs: ['dist']

  dev:
    command: 'pnpm'
    args: ['run', 'start']
    preset: 'server'
    options:
      cache: false
      interactive: true

  typecheck:
    command: 'pnpm'
    args: ['run', 'typecheck']
```

Add `.moon/cache/` to `.gitignore` so Moon's generated schemas and cache remain local.

- [ ] **Step 4: Document the Moon commands**

Add a `Moon commands` section to `README.md` after the reproduction instructions:

````markdown
## Moon commands

The repository pins Moon through Proto. From the repository root:

```sh
moon run app:build
moon run app:dev
moon run app:typecheck
```

`app:build` writes a production iOS export to `dist/`. `app:dev` starts the interactive Expo development server.
````

- [ ] **Step 5: Verify Moon discovery and non-server tasks**

Run:

```bash
moon query tasks
moon run app:typecheck
moon run app:build
```

Expected: Moon discovers `app:build`, `app:dev`, and `app:typecheck`; typechecking exits 0; the build exits 0 and creates `dist/metadata.json` plus an iOS bundle.

- [ ] **Step 6: Verify the development server reaches ready state**

Run `moon run app:dev`, confirm Metro prints its ready instructions, then send Ctrl-C. Expected: the task starts interactively without a configuration error and exits cleanly when interrupted.

- [ ] **Step 7: Commit the Moon setup**

```bash
git add .gitignore .prototools .moon/workspace.yaml moon.yaml package.json README.md
git commit -m "Add Moon tasks for Expo development"
```

### Task 3: Final verification and publication

**Files:**
- Verify only; no source changes expected.

**Interfaces:**
- Consumes: Commits from Tasks 1 and 2.
- Produces: A clean, public `main` branch whose remote head matches the verified local head.

- [ ] **Step 1: Run final checks on the committed tree**

Run:

```bash
pnpm run typecheck
moon query tasks
moon run app:build
git diff --check HEAD~2..HEAD
git status --short
```

Expected: all validation commands exit 0, the diff check is empty, and the working tree is clean.

- [ ] **Step 2: Push the verified commits**

```bash
git push origin main
```

- [ ] **Step 3: Confirm local and remote heads match**

Run:

```bash
git rev-parse HEAD
git rev-parse origin/main
```

Expected: both commands print the same commit SHA.
