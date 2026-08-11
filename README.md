# Expo Camera Simulator freeze reproduction

Minimal reproduction for an iOS Simulator UI freeze after repeatedly mounting and dismissing an `expo-camera` `CameraView`. Saving an image before dismissing makes the issue easy to reproduce at a normal manual pace.

The saved image is a fixed 1×1 base64 JPEG. This repo does not call `takePictureAsync`, write a file, upload anything, or contain application-specific camera logic.

## Environment

- Expo `57.0.9`
- expo-camera `57.0.3`
- React Native `0.86.2`
- Xcode `26.6` (17F113)
- iOS `26.5` Simulator, iPhone 17 Pro
- macOS `26.5.1` (25F80)

The Expo version is intentionally pinned to the affected version instead of the latest SDK 57 patch.

## Reproduction

1. Boot an iOS Simulator.
2. Run `pnpm install`.
3. Run `pnpm ios`.
4. Grant camera permission.
5. Tap **Open Camera**, then **Save Placeholder**.
6. Repeat step 5 three times quickly.

The two primary buttons intentionally occupy the same screen coordinate, so the open/save cycle can be repeated without moving the pointer.

Expected: each modal dismisses immediately and the main UI stays responsive.

Actual: the Simulator UI can freeze for roughly 9–15 seconds, commonly around the third saved image. The delay can begin before the modal finishes dismissing or immediately afterward.

The **Cancel** button provides a control path that dismisses the same `CameraView` without adding an image to state. In automated validation, the primary three-save flow reproduced the freeze. A more aggressive five-cycle Cancel-only run also left the fifth modal stuck. This indicates that saving is a reproducibility amplifier, not the native root cause; rapid failed session startup and teardown is sufficient on its own.

## Moon commands

The repository pins Moon through Proto. From the repository root:

```sh
moon run app:build
moon run app:dev
moon run app:typecheck
```

`app:build` writes a production iOS export to `dist/`. `app:dev` starts the interactive Expo development server.

## Focused Simulator logs

One three-save run produced the following sequence. Each new session fails immediately, then its session-start work times out roughly nine seconds later:

```text
18:20:12.336  FigCaptureSessionSimulator signalled err=-12782
18:20:12.348  AVFoundationErrorDomain Code=-11800, underlying status -12782
18:20:14.876  FigCaptureSessionSimulator signalled err=-12782
18:20:14.877  AVFoundationErrorDomain Code=-11800, underlying status -12782
18:20:17.242  FigCaptureSessionSimulator signalled err=-12782
18:20:17.244  AVFoundationErrorDomain Code=-11800, underlying status -12782
18:20:21.347  AVCaptureSession _buildAndRunGraph: Timed out waiting for session to start
18:20:23.878  AVCaptureSession _buildAndRunGraph: Timed out waiting for session to start
18:20:26.243  AVCaptureSession _buildAndRunGraph: Timed out waiting for session to start
18:20:30.352  AVCaptureSession dealloc
```

To collect the same focused logs after reproducing:

```sh
xcrun simctl spawn booted log show --last 3m --style compact --info --debug \
  --predicate 'eventMessage CONTAINS[c] "FigCaptureSessionSimulator" OR eventMessage CONTAINS[c] "_buildAndRunGraph" OR eventMessage CONTAINS[c] "AVCaptureSession" OR eventMessage CONTAINS[c] "-12782" OR eventMessage CONTAINS[c] "-11800"'
```

The log sequence is consistent with overlapping failed Simulator camera-session startups and teardown waiting for those pending starts, rather than time spent capturing or persisting the placeholder image.

A refreshed six-cycle run on the same booted Simulator completed four saves before blocking on the fifth. Each rapidly created session again reported `-12782` and `-11800`, followed by the same staggered nine-second `_buildAndRunGraph` timeouts.

Potentially related upstream change: [expo/expo#44159](https://github.com/expo/expo/pull/44159).
