# Jo Builds — jobuilds.co.uk

Personal website for Jo Builds, a Glasgow-based web design freelance business.

## Files
- `index.html` — the main website (rename from joanna_website.html before uploading)

## How to deploy on GitHub Pages

1. Rename `joanna_website.html` to `index.html`
2. Create a new **public** repository on github.com
3. Upload `index.html` to the repository
4. Go to **Settings → Pages**
5. Set source to **Deploy from a branch → main → / (root)**
6. Your site will be live at `yourusername.github.io/reponame`

## How to connect jobuilds.co.uk (Cloudflare)

In your GitHub Pages settings, add `jobuilds.co.uk` as a custom domain.

Then in Cloudflare DNS, add these records:

| Type  | Name | Value                  |
|-------|------|------------------------|
| A     | @    | 185.199.108.153        |
| A     | @    | 185.199.109.153        |
| A     | @    | 185.199.110.153        |
| A     | @    | 185.199.111.153        |
| CNAME | www  | yourusername.github.io |

Replace `yourusername` with your actual GitHub username.

Also make sure **Proxy status** is set to **DNS only** (grey cloud, not orange) for all of these records in Cloudflare — GitHub needs to handle the SSL certificate itself.

## To update the site
1. Edit `index.html` locally
2. Upload the new version to GitHub (drag and drop, then commit)
3. Changes go live within 1-2 minutes

## Email
hello@jobuilds.co.uk is set up via Cloudflare Email Routing and forwards to joannagillan@outlook.com
