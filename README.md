# GitLabBar

> **Note**: This is an experimental project for personal use. If it helps someone else, great! No guarantees are provided regarding stability or maintenance. The application may change at any time without backward compatibility.

A macOS menu bar application for tracking GitLab merge requests, pipelines, and releases at a glance.

## Features

### Menu Bar Icon

GitLabBar lives in your macOS menu bar with a color-coded icon that reflects your current status:

| Icon Color | Meaning |
|------------|---------|
| **Red** | At least one pipeline has failed |
| **Orange** | Pipelines are currently running |
| **Green** | Everything is fine, MRs or pipelines are present |
| **Gray** | No data or no active account |

The icon status only considers **visible** items. If you dismiss a failed pipeline, the icon will update accordingly.

### Merge Requests

Track all your merge requests organized by category:

- **To review**: MRs where you are assigned as a reviewer
- **Assigned**: MRs assigned to you
- **Created by me**: MRs you authored
- **No reviewer**: MRs from watched projects that have no reviewer assigned (optional)

Each MR displays:
- Author avatar, name and username
- Project path and MR number
- **Source branch → Target branch** with visual distinction
- **Draft** badge for work-in-progress MRs
- **Conflicts** badge when merge conflicts exist
- Assignees avatars
- Reviewers avatars
- Time since creation

### Pipelines

Monitor your CI/CD pipelines in real-time:

- **Running/Pending**: Active pipelines with current stage information
- **Failed**: Recent failed pipelines (configurable time window)

Each pipeline shows:
- Project path and branch name (with git icon)
- Current status (Running, Failed, Success, Pending, Canceled)
- Pipeline source (Push, Web, API, MR, Schedule, Trigger...)
- **Triggered by**: Avatar and name of who triggered the pipeline
- Individual job statuses grouped by stage

### Releases

Track releases from your watched projects:

- Release tag and name
- Release date
- Deployment status (if configured)
- Environment information

### Dismiss & Restore

You can **dismiss** any item (MR, pipeline, or release) to hide it temporarily:

1. Click the **×** button on any item to dismiss it
2. The item will be hidden from the list
3. A counter shows how many items are hidden (e.g., "2 hidden")
4. Click **Show all** to restore all dismissed items

**Important**: Dismissed items are excluded from the tray icon status calculation. For example, if you dismiss all failed pipelines, the icon will no longer be red.

### Resizable Window

The popup window can be resized by dragging its edges. Your preferred size is automatically saved and restored on next launch.

### Multi-Account Support

Connect multiple GitLab accounts from different instances:

- GitLab.com
- Self-hosted GitLab instances
- Enable/disable accounts individually

### Watched Projects

Select specific projects to monitor for:

- Pipelines (including failed ones)
- Releases and deployments
- Unassigned merge requests

### Notifications

Receive native macOS notifications for:

- New MR assigned to you
- Mentioned in an MR
- Pipeline started
- Pipeline failed
- Pipeline succeeded

All notification types can be individually enabled/disabled.

### General Settings

- **Refresh interval**: 30 seconds to 10 minutes
- **Failed pipeline age limit**: Only show failures from the last X hours
- **Launch at startup**: Start GitLabBar when you log in
- **Dark mode**: Automatically adapts to your macOS appearance

## Installation

### Quick Install (one-liner)

**Fresh install:**

```bash
curl -sL https://api.github.com/repos/yoanbernabeu/GitLabBar/releases/latest \
  | grep darwin-arm64 | grep -o 'https://.*\.zip' \
  | xargs curl -sLo /tmp/GitLabBar.zip
unzip -qo /tmp/GitLabBar.zip -d /Applications
xattr -cr /Applications/GitLabBar.app
rm /tmp/GitLabBar.zip
echo 'GitLabBar installed!'
```

**Upgrade (replace an existing version):**

```bash
killall GitLabBar 2>/dev/null
rm -rf /Applications/GitLabBar.app
curl -sL https://api.github.com/repos/yoanbernabeu/GitLabBar/releases/latest \
  | grep darwin-arm64 | grep -o 'https://.*\.zip' \
  | xargs curl -sLo /tmp/GitLabBar.zip
unzip -qo /tmp/GitLabBar.zip -d /Applications
xattr -cr /Applications/GitLabBar.app
rm /tmp/GitLabBar.zip
echo 'GitLabBar upgraded!'
```

> Your configuration (accounts, watched projects, settings) is preserved across upgrades.

### From Releases (manual)

1. Download the latest `.dmg` file from the [Releases](https://github.com/yoanbernabeu/GitLabBar/releases) page
2. Open the `.dmg` file
3. Drag **GitLabBar** to your Applications folder
4. Launch GitLabBar from Applications

### Bypassing macOS Gatekeeper

Since GitLabBar is not signed with an Apple Developer certificate, macOS will block the app on first launch. The one-liner commands above handle this automatically via `xattr -cr`. If you installed manually, here's how to allow it:

#### Method 1: Right-click to Open (Simplest)

1. Right-click (or Control-click) on GitLabBar in your Applications folder
2. Select **Open** from the context menu
3. Click **Open** in the dialog that appears
4. GitLabBar will now be allowed to run

#### Method 2: System Preferences

1. Try to open GitLabBar normally (it will be blocked)
2. Go to **System Preferences** → **Security & Privacy** → **General**
3. You'll see a message about GitLabBar being blocked
4. Click **Open Anyway**
5. Click **Open** in the confirmation dialog

#### Method 3: Terminal Command

Remove the quarantine attribute from the app:

```bash
xattr -cr /Applications/GitLabBar.app
```

Then open GitLabBar normally.

## Building from Source

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [npm](https://www.npmjs.com/) 9 or later
- macOS (for building the macOS app)

### Steps

1. Clone the repository:

```bash
git clone https://github.com/yoanbernabeu/GitLabBar.git
cd GitLabBar
```

2. Install dependencies:

```bash
npm install
```

3. Run in development mode:

```bash
npm start
```

4. Build the application:

```bash
npm run make
```

The built application will be available in the `out/make` directory.

## Configuration

### Adding a GitLab Account

1. Click the GitLabBar icon in your menu bar
2. Click **Preferences** at the bottom of the popup
3. Go to the **Accounts** tab
4. Click **Add account**
5. Enter your GitLab instance URL (e.g., `https://gitlab.com` or your self-hosted URL)
6. Enter your Personal Access Token
7. Click **Validate token** to verify the connection
8. Give your account a name and click **Add account**

### Creating a Personal Access Token

1. Go to your GitLab instance → **Settings** → **Access Tokens**
2. Create a new token with the following scopes:
   - `read_api` - Read access to the API
   - `read_user` - Read access to your user profile
3. Copy the token and paste it in GitLabBar

### Setting Up Watched Projects

1. Go to **Preferences** → **Projects**
2. Search for projects by name
3. Check the projects you want to monitor
4. These projects will be used for:
   - Tracking failed pipelines
   - Showing releases
   - Displaying unassigned MRs (if enabled)

## Tech Stack

- [Electron](https://www.electronjs.org/) - Cross-platform desktop app framework
- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Fast build tool
- [Electron Forge](https://www.electronforge.io/) - Electron tooling

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Yoan Bernabeu** - [GitHub](https://github.com/yoanbernabeu)
