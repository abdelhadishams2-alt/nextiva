# ChainIQ — Release Checklist

> **Pre-deployment verification checklist**

## Pre-Release

- [ ] All tests pass (`npm test` — 228+ tests)
- [ ] No P0/P1 security findings open
- [ ] RLS verified on all tables
- [ ] CORS set to production allowlist
- [ ] Security headers configured
- [ ] Environment variables set in Coolify
- [ ] Health check returns 200
- [ ] Readiness check returns 200

## Deployment

- [ ] Database migrations applied
- [ ] Bridge server deployed via Coolify
- [ ] Dashboard deployed (Vercel/Coolify)
- [ ] Cloudflare DNS configured
- [ ] SSL certificate valid
- [ ] Rate limiting rules active

## Post-Deployment

- [ ] Smoke test: login, generate article, edit section
- [ ] Monitoring configured (UptimeRobot)
- [ ] Error tracking verified
- [ ] Changelog updated
