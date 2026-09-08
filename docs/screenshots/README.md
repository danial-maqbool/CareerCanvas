# Screenshot provenance

These twelve PNGs show the fictional Alex Morgan demo workspace. Companies, achievements, education, applications, and interview records are synthetic. No personal resume, private job application, generated PDF, or DOCX is included.

Capture date: 2026-09-09. Viewport: 1440 x 1000, device scale 1, local Chromium browser, light theme. The capture script checks the demo identity, four-resume count, twelve-application count, and fictional company labels, then captures actual interactive application screens. ATS and job matching are run through their real UI. Captures are visually reviewed before publication.

To reproduce, start a separate empty local workspace, load Demo Career, then run from `frontend`:

```powershell
node scripts/capture-screenshots.mjs
```

An optional `CAREERCANVAS_SCREENSHOT_URL` can point to that isolated local instance. Never capture personal workspace records for publication. The script does not reset or overwrite the workspace, but it does run analysis on the fictional AI Engineer resume.
