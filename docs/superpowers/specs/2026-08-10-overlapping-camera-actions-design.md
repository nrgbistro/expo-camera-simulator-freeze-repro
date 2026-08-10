# Overlapping Camera Actions Design

## Problem

The reproduction screen begins too close to the top of the iPhone 17 Pro display, so its title intersects the Dynamic Island. The main-screen Open Camera button and modal Save Placeholder button also live in unrelated layouts, which forces a tester to move the pointer between every camera cycle.

## Layout

- Give the main screen 72 points of top padding and 24 points of horizontal padding.
- Replace the native buttons with a fixed-size reusable action button.
- Place Open Camera and Save Placeholder in the same centered absolute action slot, 112 points from the bottom of their respective full-height screens.
- Place Cancel in a second centered slot 48 points from the bottom of the camera modal.
- Add enough bottom padding to the photo grid that saved images do not scroll behind the fixed action.

Because the page-sheet camera modal is bottom-aligned, using the same button dimensions and bottom offset gives Open Camera and Save Placeholder the same screen coordinate. A tester can therefore repeat open/save cycles without moving the pointer.

## Verification

- Use a small source-level layout check to establish the intended shared geometry before and after implementation; this repro does not need a new test framework.
- Run the existing TypeScript and Moon build checks.
- Capture main-screen and camera-modal Simulator screenshots to verify Dynamic Island clearance and shared button placement.
- Run rapid repeated placeholder saves through Maestro on the currently booted Simulator.
- During a reproduced lockup, collect focused Simulator logs for `FigCaptureSessionSimulator`, `AVCaptureSession`, `_buildAndRunGraph`, `-12782`, and `-11800`, plus a process sample when possible. Compare that evidence with the previously identified capture-session startup and teardown pathway.

## Scope

This change is limited to the standalone reproduction app's photo-capture UI and its reproduction documentation. It does not change camera lifecycle behavior or introduce camera-session reuse.
