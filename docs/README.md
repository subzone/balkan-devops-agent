# GitHub Pages Configuration

This directory contains the GitHub Pages documentation for the Balkan DevOps Agents extension.

## Setup Instructions

1. **Enable GitHub Pages:**
   - Go to your GitHub repository: https://github.com/subzone/balkan-devops-agent
   - Click **Settings** → **Pages**
   - Under **Source**, select: `Deploy from a branch`
   - Select branch: `main` and folder: `/docs`
   - Click **Save**

2. **Your site will be published at:**
   ```
   https://subzone.github.io/balkan-devops-agent/
   ```

3. **Automatic Deployment:**
   - Any changes pushed to the `docs/` folder will automatically update the site
   - Usually takes 1-2 minutes to deploy

## Files

- `index.html` - Main landing page with full documentation
- `README.md` - This file (setup instructions)

## Customization

To customize the site:
- Edit `index.html` to change content, styling, or layout
- Add screenshots to `docs/images/` folder
- Add additional pages as needed

## Local Testing

To test locally:
```bash
cd docs
python3 -m http.server 8000
# Visit http://localhost:8000
```
