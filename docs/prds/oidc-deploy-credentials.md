# PRD: OIDC Deploy Credentials

> Primary/detailed PRD: `per-app-buckets-and-oidc-deploy.md` in `akli-infrastructure`. Sibling companion PRDs: `oidc-deploy-credentials.md` in `pokedex` and `sand-box`. This PRD covers only `personal-website`'s own side of the migration.

## Overview

Swap `personal-website`'s deploy workflow from a static AWS access key (shared across every app repo) to GitHub OIDC — the workflow assumes a dedicated, repo-scoped IAM Role instead of authenticating with a long-lived secret.

## Problem Statement

`.github/workflows/deploy.yml` currently authenticates to AWS via `secrets.AWS_ACCESS_KEY_ID`/`secrets.AWS_SECRET_ACCESS_KEY` — a static key belonging to the shared `github-actions-deploy` IAM User (see the primary PRD for why that user is being retired: it's over-privileged and copied into multiple repos as a long-lived secret). `akli-infrastructure` is creating a `PersonalWebsiteDeployRole` scoped to this exact repo; this PRD updates the workflow to use it.

## Goals

- `deploy.yml` authenticates via OIDC (`role-to-assume`), with no static AWS key anywhere in this repo's secrets
- The deploy behaves identically otherwise — same bucket (`SiteBucket`, unchanged by the primary PRD), same S3 sync exclusions, same CloudFront invalidation, same Lambda update step

## Non-Goals

- Any change to what gets deployed, where it's deployed to, or the SSR Lambda update step's logic — only the authentication method changes
- Removing the `S3_BUCKET_NAME`/`CLOUDFRONT_DISTRIBUTION_ID`/`SSR_LAMBDA_FUNCTION_NAME` secrets — these aren't credentials and are unaffected

## User Stories

- As the site owner, I want this repo's CI to hold no long-lived AWS secret, so a leaked GitHub secret here can't be used outside of an actual live workflow run.

## Design & UX

No UI — CI configuration only. No visible change to the deployed site.

## Technical Considerations

- In `.github/workflows/deploy.yml`, the `Configure AWS credentials` step (`aws-actions/configure-aws-credentials@v6`) changes from `aws-access-key-id`/`aws-secret-access-key` inputs to `role-to-assume: <PersonalWebsiteDeployRole ARN>` (the ARN is not sensitive — see the primary PRD — it can be committed directly or kept as a repo variable, either is fine).
- The job (or workflow) must add `permissions: id-token: write` — required for GitHub to issue the OIDC token this step exchanges for credentials. Without it, `configure-aws-credentials` fails outright. This is the most common OIDC setup mistake and is the main thing to get right here. Add `permissions: contents: read` alongside it — declaring a `permissions:` block zeroes out every unlisted scope by default, which could otherwise starve `actions/checkout` of read access (low risk today since this repo is public, but worth setting explicitly).
- `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` repo secrets are deleted once the new workflow is verified working — not left behind unused.
- Sequencing dependency: this change only works once `akli-infrastructure`'s `PersonalWebsiteDeployRole` actually exists (i.e. the primary PRD's CDK changes are deployed first).

### Testing

No testable application logic — this is a CI-configuration-only change. Verified by a real workflow run succeeding (a push to `main`, or a manual dispatch if preferred first) rather than an automated test.

## Acceptance Criteria

- [ ] `deploy.yml`'s AWS credentials step uses `role-to-assume` with no `aws-access-key-id`/`aws-secret-access-key` inputs
- [ ] The workflow declares `permissions: id-token: write` and `permissions: contents: read`
- [ ] A real deploy run (push to `main`) succeeds: S3 sync, Lambda update, and CloudFront invalidation all complete as before
- [ ] `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` secrets are removed from this repo's GitHub Actions settings after the new workflow is verified

## Open Questions

- None.
