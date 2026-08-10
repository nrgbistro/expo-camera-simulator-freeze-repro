# Overlapping Camera Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the reproduction UI clear of the Dynamic Island, make Open Camera and Save Placeholder occupy the same click target, and verify the current Simulator lockup against the previously identified `AVCaptureSession` pathway.

**Architecture:** Keep the standalone app in `App.tsx`, adding a reusable fixed-size `ActionButton` and a shared absolute `primaryAction` slot used by both the main screen and page-sheet modal. Add a dependency-free source verifier for the layout contract, then validate the rendered geometry and native camera failure path on the currently booted Simulator.

**Tech Stack:** Expo 57, React Native 0.86, TypeScript 6, Node.js assertions, Moon, Maestro, Xcode Simulator tools

## Global Constraints

- Give the main screen 72 points of top padding and 24 points of horizontal padding.
- Place Open Camera and Save Placeholder in the same centered absolute action slot, 112 points from the bottom.
- Place Cancel in a centered absolute action slot 48 points from the bottom.
- Do not change camera lifecycle behavior or introduce camera-session reuse.
- Keep changes limited to the standalone reproduction app's photo-capture UI, validation, and documentation.

---

### Task 1: Shared Camera Action Geometry

**Files:**
- Create: `scripts/verify-layout.mjs`
- Modify: `App.tsx`

**Interfaces:**
- Consumes: Existing `setIsCameraOpen`, `savePlaceholder`, and `requestPermission` callbacks in `App.tsx`.
- Produces: `ActionButton({ label, onPress, variant? })`, `styles.primaryAction`, `styles.secondaryAction`, and a dependency-free layout contract executable with `node scripts/verify-layout.mjs`.

- [ ] **Step 1: Write the failing layout contract**

Create `scripts/verify-layout.mjs` with assertions that read `App.tsx` and require the agreed layout:

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../App.tsx', import.meta.url), 'utf8')

assert.match(source, /paddingTop:\s*72/, 'main screen needs 72pt top padding')
assert.match(
  source,
  /paddingHorizontal:\s*24/,
  'main screen needs 24pt horizontal padding',
)
assert.equal(
  source.match(/style=\{styles\.primaryAction\}/g)?.length,
  2,
  'Open Camera and Save Placeholder must share primaryAction',
)
assert.match(source, /primaryAction:\s*\{[\s\S]*?bottom:\s*112/, 'primary action must sit 112pt from the bottom')
assert.match(source, /secondaryAction:\s*\{[\s\S]*?bottom:\s*48/, 'Cancel must sit 48pt from the bottom')
```

- [ ] **Step 2: Run the contract to verify it fails**

Run: `node scripts/verify-layout.mjs`

Expected: FAIL with `main screen needs 72pt top padding` because the current screen has no top padding.

- [ ] **Step 3: Implement the reusable action and shared slots**

In `App.tsx`, replace `Button` with `Pressable`, define this reusable component, and place both primary actions in `styles.primaryAction` containers:

```tsx
type ActionButtonProps = {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
}

function ActionButton({
  label,
  onPress,
  variant = 'primary',
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variant === 'secondary' && styles.secondaryButton,
        pressed && styles.actionButtonPressed,
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          variant === 'secondary' && styles.secondaryButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}
```

Use `paddingTop: 72` and `paddingHorizontal: 24` on `styles.screen`; set `styles.photos` to `paddingTop: 24` and `paddingBottom: 220`; make `styles.actionButton` 240 points wide and 52 points high. Define centered absolute slots with `left: 24`, `right: 24`, and the required bottom offsets. Use the same primary button styling and slot for both Open Camera and Save Placeholder.

- [ ] **Step 4: Run focused static and TypeScript checks**

Run: `node scripts/verify-layout.mjs && moon run app:typecheck`

Expected: the layout verifier exits successfully and Moon reports `app:typecheck` passed.

- [ ] **Step 5: Commit the UI implementation**

```bash
git add App.tsx scripts/verify-layout.mjs
git commit -m "Align camera reproduction actions"
```

### Task 2: Simulator Geometry and Lockup Verification

**Files:**
- Create outside the repository: `../camera-main.png`
- Create outside the repository: `../camera-modal.png`
- Create outside the repository when a freeze occurs: `../current-simulator-freeze.sample.txt`
- Modify: none

**Interfaces:**
- Consumes: Bundle ID `com.expo.camerasimulatorfreezerepro`, the current booted iPhone 17 Pro Simulator, and the app's Open Camera/Save Placeholder accessibility labels.
- Produces: Rendered evidence for safe-area clearance and shared button coordinates, plus focused native evidence for or against the known capture-session failure pathway.

- [ ] **Step 1: Query Moon and run the build checks**

Run: `moon query tasks`, then `moon run app:build`.

Expected: Moon lists `build`, `dev`, and `typecheck` for `app`; the iOS export completes in `dist/`.

- [ ] **Step 2: Start Metro on an available port and launch the installed app**

Run `moon run app:dev`, accept port 8082 if Expo reports that 8081 is occupied, and relaunch `com.expo.camerasimulatorfreezerepro` with `xcrun simctl launch booted`.

Expected: the reproduction app loads on the current iPhone 17 Pro Simulator without interrupting the other Metro process on port 8081.

- [ ] **Step 3: Capture and inspect both UI states**

Capture `../camera-main.png` on the main screen, tap Open Camera, and capture `../camera-modal.png`. Inspect both images and accessibility frames to confirm the title clears the Dynamic Island and the centers of Open Camera and Save Placeholder are identical.

Expected: the title begins below the system obstruction; both primary buttons have a 240×52 hit box centered 112 points from the bottom.

- [ ] **Step 4: Run rapid save cycles and sample a freeze**

Use Maestro to tap the unchanged screen coordinate through at least six Open Camera/Save Placeholder cycles. If the UI blocks, immediately find the running app PID and run:

```bash
repro_pid=$(pgrep -f '/ExpoCameraSimulatorFreeze.app/ExpoCameraSimulatorFreeze' | head -n 1)
sample "$repro_pid" 2 1 -file ../current-simulator-freeze.sample.txt
```

Expected: either the lockup reproduces and the sample shows the blocked native path, or six cycles complete and the run is recorded as non-reproducing rather than treated as proof that the bug is gone.

- [ ] **Step 5: Collect focused current-instance Simulator logs**

Run:

```bash
xcrun simctl spawn booted log show --last 3m --style compact --info --debug \
  --predicate 'eventMessage CONTAINS[c] "FigCaptureSessionSimulator" OR eventMessage CONTAINS[c] "_buildAndRunGraph" OR eventMessage CONTAINS[c] "AVCaptureSession" OR eventMessage CONTAINS[c] "-12782" OR eventMessage CONTAINS[c] "-11800"'
```

Expected when the identified pathway occurs: `FigCaptureSessionSimulator` reports `-12782`, AVFoundation wraps it as `-11800`, and `_buildAndRunGraph` times out roughly nine seconds later. Report any different sequence accurately.

### Task 3: Reproduction Evidence and Publication

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: The exact timestamps and messages from Task 2.
- Produces: A concise, human-readable current verification note without overstating a nondeterministic run.

- [ ] **Step 1: Update the verification note only if new evidence changes or strengthens it**

If Task 2 reproduces the same pathway, add one short sentence noting that the refreshed run on the current Simulator produced the same error/timeout sequence. If it does not reproduce, leave the existing focused logs intact and add no speculative conclusion.

- [ ] **Step 2: Run final verification**

Run:

```bash
node scripts/verify-layout.mjs
moon run app:typecheck
moon run app:build
git diff --check
git status --short
```

Expected: every command exits successfully; status lists only the intended README change if Task 2 yielded new evidence.

- [ ] **Step 3: Commit any evidence update**

If `README.md` changed:

```bash
git add README.md
git commit -m "Document refreshed Simulator verification"
```

- [ ] **Step 4: Push the completed reproduction update**

Run: `git push origin main`

Expected: the public repository's `main` branch advances to the verified local commit without touching the Platform worktree.
