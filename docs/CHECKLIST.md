# Pre-Deployment Checklist

Complete these steps before going live with **VangaTypePanalam**.

## 1. Local Verification ✅
- [ ] Run `npm build` locally. It must finish with `Exit code: 0`.
- [ ] Verify `public/icons` has `icon-192.png` and `icon-512.png`.
- [ ] Check `src/engine/sessionTracker.ts` is not using any hardcoded test URLs.

## 2. Branding & Identity 🏷️
- [ ] Search "Vaaga" or "VaagaTypePanalam" globally in files. There should be **0 occurrences**. The app is "VangaTypePanalam".
- [ ] Check `README.md` features list is up to date (Auth, Cloud Sync).
- [ ] Check `package.json` name is `vanga-type-panalam`.

## 3. Operations & Security 🔒
- [ ] **GitHub OAuth**: Create a PRODUCTION OAuth app (don't use the localhost test credentials).
- [ ] **Neon DB**: Create a PRODUCTION database branch or project.
- [ ] **Env Vars**: Check that `.env` is listed in `.gitignore`. (NEVER push secrets to GitHub).
- [ ] **SSL**: Ensure your production URL is using `https`.

## 4. Feature Check ⌨️
- [ ] **Practice Mode**: Works, saves locally.
- [ ] **Auth**: Sign in works on mobile and desktop.
- [ ] **Sync**: Test data uploads to the cloud after 3 practice paragraphs.
- [ ] **Stats**: Heatmap correctly renders for the current local date.
