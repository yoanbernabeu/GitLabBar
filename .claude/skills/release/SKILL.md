---
name: Release
description: Create a new GitLabBar release with proper versioning, git tag, and GitHub release. Use when the user asks to release, publish, ship, or create a new version of the app. Handles version bump in package.json, git commit, tag, push, and GitHub release creation with English release notes.
---

# Release Process for GitLabBar

## Input

The user may provide a version number (e.g. `0.3.0`). If not provided, read the current version from `package.json`, increment the patch number, and ask the user to confirm the new version.

## Steps

1. **Read current version** from `package.json`.

2. **Determine new version**: use the user-provided version or auto-increment patch. Validate it follows semver (MAJOR.MINOR.PATCH).

3. **Check git status**: ensure the working tree is clean or that all changes are committed. If there are uncommitted changes, ask the user whether to commit them first.

4. **Bump version**: update the `version` field in `package.json` to the new version.

5. **Commit**: stage `package.json` and commit with message `Bump version to <version>`.

6. **Tag**: create git tag `v<version>`.

7. **Push**: run `git push origin main --tags` to push commit and tag.

8. **Wait for CI**: the GitHub Actions workflow triggers on `v*` tags, builds the app, and creates the release with DMG and ZIP assets. Poll the workflow status with `gh run list` every 15 seconds until the run for the tag completes. Report success or failure.

9. **Update release notes**: once CI creates the release, update the body with `gh release edit v<version> --notes "..."`. Generate notes by comparing commits since the previous tag:
   - Use `git tag --sort=-version:refname` to find the previous tag
   - Use `git log --oneline <prev-tag>..v<version>` to list changes
   - Categorize into "What's New" (features, improvements) and "Fixes" (bug fixes)
   - All notes must be written in **English**
   - Follow this format:

```
## What's New

- **Feature name**: Short description.

## Fixes

- Short description of fix.
```

10. **Verify**: run `gh release view v<version>` and confirm:
    - Release exists with correct tag
    - Assets are attached with filenames containing the correct version number
    - Release notes are present and in English

11. **Report**: display the release URL to the user.

## Rules

- All release notes and commit messages must be in **English**.
- Never skip the version bump in `package.json` — build artifacts use this version in their filenames.
- Always wait for CI to finish before updating release notes.
- If CI fails, report the error and do not update notes.
- Do not force-push or amend existing commits.
