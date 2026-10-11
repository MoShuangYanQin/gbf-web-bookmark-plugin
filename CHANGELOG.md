# Changelog

## v7.2.8
- Fixed the right-click edit menu using the old panel position after resizing.
- Updated layout immediately after width changes and anchored the menu to the current bookmark row.
- Kept the menu inside the viewport when there is not enough space on the right.
- Added independent panel width, height, and font ratio controls from 10% to 200%; width can be entered directly and must be greater than 20% and less than 200%.
- Preserved font size while changing the panel's vertical layout.

## v7.2.7
- Added panel height ratio layout controls that preserve the font size.
- Added direct width ratio input with validation.

## v7.2.3
- Added keyboard-to-left-click mapping using the proven OSU-style mouse event flow.
- Reorganized repository files so the latest script stays in the root and older scripts live under old_versions/.

## v7.2.1
- Added position locking to prevent accidental panel dragging while preserving docking and idle hiding.
- Added right-click list-tab name customization for both lists.
- Fixed the idle side-bar height growing after page refresh or bookmark-list changes.

## v7.1.8
- Fixed CSS selector leakage so the GBF page list layout is no longer affected.

## v7.1.7
- Cleaned up mouse button naming while keeping bookmark bindings.

## v7.1.6
- Rolled back the mouse-position click mapping feature.
- Expanded mouse button labels to ten entries.

## v7.1.5
- Added stronger simulated click dispatch for testing.

## v7.1.4
- Added Bilibili matching for click testing.

