# DeepBug Website Plan

## Notes
- Website will be built with TypeScript and use Firebase for backend (auth, database, storage).
- Admin has a dedicated table/collection in Firebase (fields: name, email, password).
- Admin dashboard at /admin_deep_bug_admin with advanced brute-force and guessing protection.
- Professional, responsive control panel UI.
- Dark mode toggle for the site.
- Article publishing: title, description (with formatting: large text, quote, code), image support (external and card image), category selection (programming, cybersecurity, news, projects).
- Projects section: project name, link, image, description.
- Admin can edit or delete articles.
- Registration/login button near dark mode toggle in header.
- Registration page: sign up, sign in, Google auth. Fields: name, email, password.
- Login: email and password, brute-force protection.
- Security: XSS protection, input length limits (name, email), IDOR protection in chat, advanced Firebase security rules.
- Favicon: shield with a fingerprint, title: DeepBug.
- Chat section (only for logged-in users, protected from IDOR). Admin has green 'admin' badge and controls to delete/ban/close chat.
- About section: site name and mission statement, social icons/buttons (Facebook, YouTube, Telegram) with links.
- Fully responsive and consistent design.

## Task List
- [ ] Set up TypeScript project structure.
- [ ] Integrate Firebase with provided config.
- [ ] Design database schema (admin, articles, users, chat, projects).
- [ ] Implement authentication (email/password, Google, registration/login forms, security protections).
- [ ] Create admin dashboard at /admin_deep_bug_admin with advanced protection.
- [ ] Build article publishing UI (title, description formatting, images, categories).
- [ ] Implement project publishing (name, link, image, description).
- [ ] Enable article editing/deletion by admin.
- [ ] Add dark mode toggle.
- [ ] Add registration/login button in header.
- [ ] Implement chat section with admin controls and IDOR protection.
- [ ] Add About section with mission statement and social icons.
- [ ] Add favicon and set site title to DeepBug.
- [ ] Ensure responsive, professional design.
- [ ] Harden frontend and backend (XSS, brute-force, input length, Firebase rules).

## Current Goal
Set up TypeScript project and integrate Firebase