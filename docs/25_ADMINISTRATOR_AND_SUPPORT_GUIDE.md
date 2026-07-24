# Administrator and Support Guide

## 1. Supported operating model

CPM Version `1.0.0-rc.1` is an offline-first browser application. Authoritative project data is stored in IndexedDB on the user's device. No central administrator can restore data that was never exported or backed up by the user or organization.

## 2. Qualified browser targets

The Release Qualification workflow runs browser smoke and accessibility checks against:

- Chromium desktop;
- Firefox desktop;
- WebKit desktop;
- Chromium mobile emulation.

The workflow verifies application startup, IndexedDB project creation and reload, primary workspace access, automated WCAG checks, and an offline service-worker reload in Chromium. Real-device acceptance remains necessary for organization-specific deployment environments.

## 3. Storage policy

Administrators should require:

- persistent browser storage where supported;
- periodic `.cpmproj` exports;
- a documented backup destination;
- clear restrictions against browser-data cleaners for managed devices;
- export before browser profile reset, device replacement, or operating-system reinstallation.

Storage usage and persistence status are visible in the project library. Quarantined records must be investigated before users create replacement data with the same project intent.

## 4. Update and rollback procedure

1. Publish the candidate build to the approved origin.
2. Review the generated release-evidence artifact, dependency audit, SBOM, and provenance digest.
3. Confirm the requirement gate status. A technically green workflow may still report a blocked release candidate when mandatory functional capabilities remain partial.
4. Users select **Prepare and install** when notified.
5. The application creates automatic recovery snapshots for active and archived projects.
6. The service worker activates only after snapshot preparation succeeds.
7. To roll back project data, restore the automatic pre-update snapshot.
8. To roll back application code, redeploy the previous approved build at the same origin. Do not delete browser storage during executable rollback.

## 5. Recovery procedure

Use the least-destructive option first:

1. Reload the application while online.
2. Review quarantine and diagnostics.
3. Restore a named or automatic recovery snapshot.
4. Import the latest validated `.cpmproj` export.
5. Restore the browser profile or managed-device backup only as a final step.

Every restore operation should be followed by schedule calculation, BOQ total review, baseline count review, and export of a fresh recovery file.

## 6. Support bundle

The Enterprise workspace generates a local support bundle containing schema, revision, counts, audit metadata, and diagnostics. The bundle recursively redacts owner, contractor, consultant, location, email, token, password, secret, and authorization fields.

Before sharing, users should still inspect the JSON because project names, activity names, and free-text descriptions may contain organization-sensitive information.

## 7. Security response

The release workflow blocks high or critical dependency advisories. Project-file imports reject:

- files above 25 MB;
- excessive JSON nesting, nodes, keys, or string payloads;
- prototype-pollution keys;
- invalid envelopes;
- unsupported schemas;
- checksum mismatches;
- invalid IDs and damaged references.

Security findings should be recorded with severity, affected release, evidence, mitigation, owner, and resolution state. A Version 1 release cannot be qualified with an unresolved critical or high finding.

## 8. Evidence retention

Retain the following for every approved release:

- release-evidence JSON;
- provenance JSON and build digest;
- CycloneDX SBOM;
- npm audit JSON;
- browser reports and failure traces;
- migration, recovery, performance, and accessibility test output;
- known limitations and requirement blockers;
- source commit and merged pull request.

## 9. Escalation levels

- **P0:** confirmed data loss, unsafe import, corrupted recovery path, or critical security issue. Stop distribution immediately.
- **P1:** repeatable calculation error, broken offline startup, inaccessible core workflow, or high security issue.
- **P2:** major feature failure with a safe workaround.
- **P3:** localized usability, reporting, or compatibility issue.
- **P4:** cosmetic or documentation issue.

P0 and P1 incidents require a preserved support bundle, exported affected project when safe, reproduction steps, browser/version details, and release evidence reference.
