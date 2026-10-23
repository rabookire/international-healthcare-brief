# PR #4 verification resumed — October 23, 2026

Source under test: `6d41c0246b0ba7616e21ede9de8c2463b094c56d`, checked out from `codex/map-first-current-partnerships` in a fresh isolated workspace. The PR was open, draft, unmerged, and based on `564d5880151228c0a145d74d99bde95d4c90a362` when checked. No source/data changes were needed for this verification attempt.

## Executed checks

```sh
npm ci --ignore-scripts
npm run check
npm run format:check
python3 scripts/package_site.py
```

All passed: 24 generated projections agree, 28 Python tests and 50 JavaScript tests pass, Prettier accepts the reader sources, and public static packaging completes. The existing GitHub Actions run for the exact source SHA also completed successfully: [run 39877000960](https://github.com/rabookire/international-healthcare-brief/actions/runs/39877000960). Its deployment job was skipped.

## Browser attempts and limits

The cloud Chrome browser is available in the new environment. Opening the repository preview on `http://127.0.0.1:4173/map/` returned `net::ERR_CONNECTION_REFUSED`. A temporary dependency-free Node static server reported listening on port 4174, but Chrome's localhost request also returned `net::ERR_CONNECTION_REFUSED`. The environment's advertised `terminal.local` host route returned `net::ERR_BLOCKED_BY_CLIENT` in Chrome. No browser security or network policy was changed, no external tunnel was created, and no alternate hosting deployment was made.

These are preview-connectivity failures. They do not establish that the application fails to render or that its UI passes. No implementation screenshot, measured viewport, browser console inspection, pointer/touch journey, screen-reader result, or source/reference image comparison was obtained. Automated results remain separate from visual verification.

## Remaining gate

`design-qa.md` remains **final result: blocked**. Complete the actual-browser journeys in `VERIFICATION.md` from a supported preview with access to this exact source (or any subsequent reviewed source revision). Capture and inspect desktop/mobile, 320px and 200% zoom states before changing that result. Keep PR #4 draft. Merge and deployment remain outside the authorized scope.
