# Update Management

## How Updates Work

Balkan DevOps Agents automatically updates through the VS Code extension marketplace. Here's how it works:

### Automatic Updates (Default)

By default, VS Code automatically downloads and installs extension updates:

1. **Background Check**: VS Code checks for updates every few hours
2. **Auto-Download**: New versions are downloaded automatically
3. **Install on Restart**: Updates are applied when you reload/restart VS Code
4. **Notification**: You'll see a notification about the update with "What's New" link

### Update Settings

You can control update behavior in VS Code settings:

```json
{
  // Auto-update all extensions (default)
  "extensions.autoUpdate": true,
  
  // Or disable for manual control
  "extensions.autoUpdate": false,
  
  // Check for updates frequency
  "extensions.autoCheckUpdates": true
}
```

### Manual Update Check

To manually check for updates:

1. Open **Extensions** panel (Cmd+Shift+X / Ctrl+Shift+X)
2. Search for "Balkan DevOps Agents"
3. If update available, click **Update** button

Or use command palette:
- Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
- Type: `Extensions: Check for Extension Updates`

### Update Notifications

When a new version is installed, you'll receive a notification:

```
🎉 Balkan DevOps Agents ažurirano na v1.1.0!
[Šta je novo?] [Dokumentacija]
```

Clicking "Šta je novo?" opens the [CHANGELOG.md](CHANGELOG.md) with release notes.

## Version History

All versions are tracked in:
- **[CHANGELOG.md](CHANGELOG.md)** - Detailed change log
- **[GitHub Releases](https://github.com/subzone/balkan-devops-agent/releases)** - Release notes with VSIX downloads

## Release Schedule

- **Major versions** (1.0.0 → 2.0.0): Breaking changes, major new features
- **Minor versions** (1.0.0 → 1.1.0): New agents, features, improvements  
- **Patch versions** (1.0.0 → 1.0.1): Bug fixes, typo corrections

## Rollback to Previous Version

If you need to downgrade:

1. Go to [GitHub Releases](https://github.com/subzone/balkan-devops-agent/releases)
2. Download the desired version's `.vsix` file
3. Uninstall current version:
   ```bash
   code --uninstall-extension subzone.balkan-devops-agents
   ```
4. Install specific version:
   ```bash
   code --install-extension balkan-devops-agents-X.Y.Z.vsix
   ```
5. Disable auto-update for this extension in VS Code settings

## Pre-release Versions

Pre-release versions allow testing new features before stable release:

1. Open **Extensions** panel
2. Find "Balkan DevOps Agents"  
3. Click gear icon → **Install Pre-Release Version**

Pre-release versions have `-beta` suffix (e.g., `1.1.0-beta.1`)

## Update via GitHub Actions

Our CI/CD automatically publishes updates when you push a version tag:

```bash
# Create new version
git tag v1.1.0
git push origin v1.1.0
```

This triggers:
1. Version update in package.json
2. Build and package extension
3. Create GitHub Release
4. Publish to VS Code Marketplace
5. Users receive update within hours

## Monitoring Updates

Track extension updates:

- **Marketplace**: https://marketplace.visualstudio.com/items?itemName=subzone.balkan-devops-agents
- **GitHub Releases**: https://github.com/subzone/balkan-devops-agent/releases
- **RSS Feed**: Add `/atom.xml` to releases URL for RSS notifications

## Troubleshooting

### Update Not Showing

If you're not seeing the latest version:

1. **Reload VS Code**: `Cmd+R` / `Ctrl+R`
2. **Manual check**: Extensions → Check for Updates
3. **Clear cache**: 
   ```bash
   rm -rf ~/.vscode/extensions/subzone.balkan-devops-agents-*
   code --install-extension subzone.balkan-devops-agents
   ```

### Update Failed

If update fails:

1. Check VS Code output: **View** → **Output** → **Extensions**
2. Try manual installation from marketplace
3. Report issue: https://github.com/subzone/balkan-devops-agent/issues

## For Enterprise/Offline Environments

If you're in an environment without internet access:

1. Download `.vsix` from [GitHub Releases](https://github.com/subzone/balkan-devops-agent/releases)
2. Distribute internally
3. Install via:
   ```bash
   code --install-extension balkan-devops-agents-X.Y.Z.vsix
   ```
4. Use VS Code extension management API for bulk updates

## Questions?

- **General**: Open [Discussion](https://github.com/subzone/balkan-devops-agent/discussions)
- **Bug Reports**: Create [Issue](https://github.com/subzone/balkan-devops-agent/issues)
- **Feature Requests**: Create [Issue](https://github.com/subzone/balkan-devops-agent/issues) with "enhancement" label
