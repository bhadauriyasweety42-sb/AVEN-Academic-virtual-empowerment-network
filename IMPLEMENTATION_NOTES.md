# AI Student Manager — implementation patch notes

This patch modifies the existing project; it does not replace the app.

## Changes included
- Focus Mode initializes/resumes Web Audio from the Start/Test Alarm user gesture (reducing browser autoplay blocking), plays a completion chime, shows a browser notification when permission is already granted, has a `Test alarm` button, derives countdown from a deadline to reduce background-tab drift, and restores a running/paused timer after refresh.
- Academic Smart Notes accepts PDF, PPTX, DOCX, and TXT files. PDF, PPTX slide text, DOCX body text, and TXT content are extracted before AI generation. The generation instructions explicitly require concise, source-grounded revision notes rather than reprinting extracted text.
- Timetable import accepts PDF, PPTX, DOCX, and TXT; extracted classes remain in a review step before saving. The timetable page also loads the signed-in student's saved classes on open, and the upload message makes the save step explicit.
- The reminder scheduler no longer prevents the API server from starting if VAPID configuration is missing/invalid; it logs that push scheduling is disabled.
- Removed unused student-profile fetching from the AI assistant, which was causing the existing TypeScript build to fail (`studentProfile is declared but its value is never read`).
- Added subtle pastel glassmorphism polish, focus-visible keyboard states, and gentle micro-interactions without changing the existing page layout or navigation. Reduced-motion preferences are respected.
- Added `server/.env.example`; it contains placeholders only, not real secrets.

## Install/update dependencies
From the `server` directory, run `npm install` (not `npm ci`) to sync `package.json` and `package-lock.json`, including the new `adm-zip` dependency.

## Important limitations
- Scanned/image-only PDFs and OCR of timetable photos are not implemented in this patch. The server reports this clearly rather than pretending it extracted text.
- Closed-app push requires a supported browser, permission, service worker, saved subscription, valid VAPID key pair, and a backend that remains running. A laptop that is shut down cannot send reminders.
- The server-side code was syntax-checked. The client TypeScript check passed. A full Vite production build could not run in this container because the ZIP's preinstalled Windows dependencies lack the Linux Rolldown native binding; reinstalling dependencies on the target machine should restore the correct platform binding.
