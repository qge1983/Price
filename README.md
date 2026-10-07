# QGE Rate Portal — GitHub-Ready Package

**Qaiser Group of Electronics — Salesman Rate Portal**

This repository contains the React/Vite source code, the Excel rate file, and a GitHub Actions workflow that builds the portal and publishes the generated site to GitHub Pages.

## Upload to GitHub

Upload **everything inside this package** to the **root** of your repository. Do not upload the outer ZIP folder as a nested directory.

The root should contain `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `rates.xlsx`, `src/`, `.github/workflows/deploy.yml`, and `.nvmrc`.

## One-time GitHub Pages setup

After the first upload, open:

**Repository → Settings → Pages**

Set **Source** to **GitHub Actions**.

This one-time setting is required before the Pages deployment workflow can publish the site. GitHub's Pages configuration action reports “Get Pages site failed / Not Found” when the repository has not been enabled/configured for Pages yet.

After that, each push to `main` automatically runs the build and deployment workflow.

## Expected Pages address

For repository `qge1983/Price`, GitHub Pages normally uses:

`https://qge1983.github.io/Price/`

## Excel rate file

The portal reads the root file named exactly:

`rates.xlsx`

Replace this file with your current rate sheet and commit/push it. The workflow copies the updated workbook into the published site on every deployment.

The parser supports common headings such as:

| Company | Product | Model | Cash Rate | Installment Rate | Fix Rate | Remarks | Month | Year |
|---|---|---|---:|---:|---:|---|---|---|
| HAIER | LED TV | H43K800FX | 104500 | 127000 | 114000 | Free wall mount | September | 2026 |

`Fix Rate` is shown for companies configured in `src/config.ts` (currently HAIER).

## Monthly update

1. Replace `rates.xlsx` in the repository.
2. Commit the change to `main`.
3. GitHub Actions rebuilds and republishes the portal automatically.

## Login

The project stores the configured username and password as SHA-256 hashes in `src/config.ts`, not as plain-text credentials.

This is still a **client-side/static login gate**. GitHub Pages is public hosting, so the workbook and other published assets should not be treated as confidential. Use a server-side authentication/backend solution for sensitive rate data.

## Local development

```bash
npm ci
npm run dev
```

Production build:

```bash
npm run build
```

The production output is generated in `dist/`.
