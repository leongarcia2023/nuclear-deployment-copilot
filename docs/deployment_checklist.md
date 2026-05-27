# Deployment Checklist

## Validation

- [ ] Run `npm run eval`
- [ ] Run `npm run build`
- [ ] Run `npx tsc --noEmit`

## Demo workflow

- [ ] Open Deal Diligence
- [ ] Check all five demo presets populate target, user type, decision question, and claim text
- [ ] Generate a memo from the Data center power campus preset
- [ ] Confirm the memo is concise and does not expose debug details by default
- [ ] Check Copy Memo works
- [ ] Confirm the Source Library loads
- [ ] Confirm Methodology explains the deployment risk framework

## Production readiness

- [ ] Confirm no API key is required
- [ ] Confirm no paid AI API calls are configured
- [ ] Confirm private/confidential upload language is not encouraged
- [ ] Confirm stale Market Intelligence or Company Watchlist routes are not linked in primary navigation
- [ ] Confirm production deployment starts and renders the main page
