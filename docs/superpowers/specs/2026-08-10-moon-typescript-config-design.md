# Moon and TypeScript configuration design

## Problem

The editor cannot resolve `expo/tsconfig.base`, which also removes Expo's inherited JSX setting and produces `Cannot use JSX unless the '--jsx' flag is provided`. The standalone repository also has no Moon version pin or workspace marker, so Moon cannot discover or run project tasks.

## Design

Replace the package-based TypeScript `extends` entry with the explicit compiler options from Expo 57's `tsconfig.base.json`, retain strict mode, and exclude generated native and dependency directories. This makes JSX and module resolution independent of editor package-config resolution while preserving the Expo 57 compiler behavior.

Pin Moon 2.3.4 in `.prototools`. Add `.moon/workspace.yaml` with the repository root mapped to project ID `app`, and add a root `moon.yaml` defining `build`, `dev`, and `typecheck` tasks.

The package scripts remain the command source of truth:

- `build` exports a production iOS bundle to `dist/`.
- `start` runs the Expo development server with `EXPO_NO_TYPESCRIPT_SETUP=1` so Expo does not restore the package-based `extends` entry.
- `typecheck` runs TypeScript without emitting files.

Moon delegates to those scripts, so the equivalent commands are `moon run app:build`, `moon run app:dev`, and `moon run app:typecheck`. The `dev` task is an interactive server task and is not cached. The `build` task declares `dist/` as its output.

## Validation

- Confirm the TypeScript effective configuration contains `jsx: react-jsx` and no unresolved `extends` entry.
- Run the package typecheck.
- Query Moon and confirm all three tasks are discoverable under `app`.
- Run `moon run app:build` and confirm an iOS export is written to `dist/`.
- Start `moon run app:dev`, confirm Metro reaches its ready state, then stop the bounded verification process.

## Scope

This change does not alter the camera reproduction, Expo dependency versions, native project generation, or the Platform worktree.
