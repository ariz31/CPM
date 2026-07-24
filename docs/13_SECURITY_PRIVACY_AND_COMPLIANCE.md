# Security, Privacy, and Compliance

## 1. Security objective

CPM must protect project data, calculations, files, and future collaborative workspaces against accidental loss, malicious input, unauthorized access, supply-chain compromise, and misleading audit history. The initial application is offline-first, but its security architecture must support managed and collaborative enterprise editions without redesigning the domain core.

## 2. Security principles

- Treat every imported file, attachment, formula-like value, external link, and future API response as untrusted.
- Use least privilege for browser capabilities, storage, filesystem handles, workers, plugins, identities, and future services.
- Separate authoritative project data from untrusted rendered content.
- Fail safely: damaged or suspicious data may be quarantined for inspection but must not mutate active projects.
- Keep core offline use private by default and free from mandatory telemetry.
- Make security-relevant behavior visible and auditable.
- Prefer simple, reviewable formats and protocols over opaque executable extensions.
- Design for secure updates, revocation, migration, backup, and incident response.

## 3. Threat model

### 3.1 Protected assets

- Project schedules, BOQs, cost rates, actual costs, productivity records, baselines, forecasts, risks, attachments, and reports.
- Calculation integrity and engine provenance.
- Audit and change history.
- Portable project files and recovery snapshots.
- Future credentials, organization membership, roles, API tokens, and synchronization state.
- Release signing keys, build pipelines, dependencies, and update manifests.

### 3.2 Primary threats

- Malicious `.cpmproj`, CSV, XLSX, XML, image, PDF, or archive input.
- Zip bombs, decompression bombs, oversized images, deeply nested JSON, excessive rows, and path traversal.
- Formula injection in CSV/XLSX exports.
- Cross-site scripting through names, notes, imported HTML, SVG, markdown, or report templates.
- Dependency compromise and malicious build tooling.
- Corrupted migrations, rollback failure, or partial restore.
- Unauthorized project access on shared devices.
- Data exfiltration through telemetry, external links, previews, or future sync adapters.
- Audit tampering or manual overrides presented as calculated data.
- Future tenant-isolation or authorization failures.
- Denial of service through extreme schedules, graph structures, attachments, or repeated calculations.

## 4. Offline application controls

### 4.1 Content security

- Enforce a restrictive Content Security Policy with no inline script execution.
- Do not use `eval`, dynamic function construction, or untrusted template execution.
- Sanitize any supported markdown or rich text using an allowlist.
- Never render imported SVG or HTML directly in the application origin without sanitization and isolation.
- Open external links with safe rel attributes and explicit user intent.
- Service worker routes must serve only approved application assets and user-requested local data.

### 4.2 Import isolation

Imports must use a staged pipeline:

1. Identify format without trusting extension alone.
2. Enforce compressed and expanded size limits.
3. Enforce entry count, nesting depth, row count, field length, and attachment limits.
4. Reject path traversal, absolute paths, symlinks, duplicate archive paths, and ambiguous Unicode paths.
5. Parse in a worker with time and memory limits.
6. Validate manifest, schema, checksums, references, types, precision, and invariants.
7. Produce a human-readable conversion and warning report.
8. Commit in one transaction only after user approval.
9. Create a pre-import recovery snapshot before replacement or merge.

### 4.3 Attachment controls

- Store attachment metadata separately from decoded content.
- Enforce allowed MIME types, byte limits, pixel limits, page limits, and archive limits.
- Generate thumbnails in a worker or isolated decoder.
- Do not execute macros, scripts, active PDF content, embedded HTML, or media autoplay.
- Preserve original bytes only when policy allows and clearly label unscanned content.
- Future managed editions may integrate malware scanning through a replaceable adapter.

### 4.4 CSV and spreadsheet safety

- Prefix or escape exported cells beginning with `=`, `+`, `-`, `@`, tab, or carriage return when opened by spreadsheet software.
- Preserve a raw data export option only with an explicit injection warning.
- Never execute imported formulas; import displayed values or treat formulas as text according to mapping policy.
- Validate locale-specific numeric and date conversions before commit.

## 5. Local data protection

### 5.1 Shared-device risk

The offline individual edition must communicate that browser-profile access implies project access unless optional local protection is enabled.

Planned controls:

- Optional application lock using platform credentials where available.
- Optional passphrase-encrypted portable files.
- Optional encrypted local vault for managed desktop packaging.
- Configurable automatic lock after inactivity.
- Recent-project privacy mode that hides thumbnails and sensitive totals.

### 5.2 Encryption

- Encryption must use platform-reviewed cryptographic APIs and modern authenticated encryption.
- Key derivation must use a memory-hard or approved password-based function with stored parameters and salt.
- Project encryption metadata must be versioned and support key rotation.
- Losing a user-held passphrase may make data unrecoverable; the UI must state this before enabling encryption.
- Encryption does not replace integrity checks, schema validation, or backup.

### 5.3 Data deletion

- Delete operations must distinguish application-level deletion, trash retention, snapshot retention, browser storage clearing, and external backup copies.
- The product must not claim secure physical erasure where the browser or storage platform cannot guarantee it.
- Future enterprise retention and legal hold controls must override ordinary deletion only with visible policy.

## 6. Future identity and authorization

The collaborative edition must support:

- Standards-based identity through OIDC/SAML adapters.
- Multi-factor authentication as an identity-provider capability.
- Role-based access control at organization, workspace, project, and sensitive-action levels.
- Least-privilege service credentials and short-lived tokens.
- Explicit roles such as owner, administrator, project manager, scheduler, estimator, field contributor, reviewer, auditor, and read-only viewer.
- Separation of permissions for view, edit, baseline approval, cost visibility, export, delete, restore, policy administration, and audit access.
- Server-side authorization on every request; UI hiding is never considered enforcement.
- Revocation, session expiry, device management, and organization offboarding.
- Tenant isolation tests and organization-scoped encryption/storage boundaries.

## 7. Audit integrity

- Audit events are append-only from the application perspective.
- Events record actor, device/session where available, command, affected entities, project revision, timestamp, source, and result.
- Calculation records include input revision and engine/settings hashes.
- Baseline approval and manual override events require reason and optional approver.
- Future enterprise audit exports must support signed batches or hash chaining to detect tampering.
- Audit access is itself audited in collaborative editions.
- Audit history must never contain secrets or full attachment content.

## 8. Privacy

### 8.1 Default posture

- No account is required for the initial offline edition.
- No project content, filenames, activity names, cost values, attachments, or personal data is transmitted by default.
- Usage analytics are off unless explicitly introduced and consented to.
- Crash or support diagnostics are local and user-exported by default.

### 8.2 Data minimization

Any future diagnostic or cloud service must document:

- Data fields collected.
- Purpose and legal basis where applicable.
- Retention period.
- Processing location and subprocessors.
- User and organization controls.
- Export and deletion mechanisms.
- Whether project content is ever included.

### 8.3 Sensitive fields

The data model should permit classification of fields or attachments as sensitive. Future policies may restrict display, export, offline caching, or diagnostics for cost rates, personal identifiers, contractual records, and protected attachments.

## 9. Supply-chain security

- Pin dependencies using a lockfile and review unexpected transitive changes.
- Enable dependency, secret, license, and vulnerability scanning.
- Generate an SBOM for releases.
- Verify build provenance and retain reproducible build metadata.
- Use protected branches, required reviews, signed or verified release tags where supported, and least-privilege CI tokens.
- Do not expose production signing keys to pull-request builds.
- Review post-install scripts and avoid unnecessary native or executable dependencies.
- Track security advisories with severity, exploitability, exposure, fix version, and accepted-risk expiration.
- Remove abandoned dependencies from security-sensitive paths.

## 10. Secure development lifecycle

Every substantial feature requires:

- Security impact section in the design or pull request.
- Updated threat model where new trust boundaries appear.
- Abuse and resource-exhaustion cases.
- Secure defaults and least-privilege permissions.
- Unit and integration tests for validation and authorization.
- Fuzz or property testing for parsers and file formats where appropriate.
- Dependency and static analysis checks.
- Security review before release for imports, encryption, sync, auth, plugins, or report rendering.

## 11. Security requirements and tests

| Control ID | Requirement | Minimum verification |
|---|---|---|
| SEC-001 | Restrictive CSP and no dynamic code execution | Automated header/build inspection and XSS corpus test |
| SEC-002 | Staged import before mutation | Malicious and corrupted corpus proves zero partial writes |
| SEC-003 | Archive resource limits | Zip bomb, nesting, duplicate path, traversal, and expanded-size tests |
| SEC-004 | Safe rich-text rendering | Script, event-handler, URL, SVG, and CSS escape corpus |
| SEC-005 | Attachment limits | Oversized bytes, pixels, pages, malformed codecs, and memory tests |
| SEC-006 | CSV formula-injection protection | Export corpus opens as inert values in supported spreadsheet tools |
| SEC-007 | Optional encrypted bundles | Known-answer, tamper, wrong-passphrase, key-rotation, and recovery tests |
| SEC-008 | No mandatory telemetry | Offline network inspection shows no unexpected requests |
| SEC-009 | Redacted support bundle | Secret, project-content, and personal-data redaction tests |
| SEC-010 | Audit completeness | All authoritative command classes emit correct structured events |
| SEC-011 | Audit tamper evidence for enterprise service | Mutation or deletion is detected in signed/hash-chained export |
| SEC-012 | Least-privilege future RBAC | Deny-by-default matrix across roles and actions |
| SEC-013 | Tenant isolation | Cross-tenant identifier, cache, export, and storage access tests |
| SEC-014 | Token and session security | Expiry, revocation, replay, logout, and stolen-token tests |
| SEC-015 | Dependency governance | SBOM, vulnerability, license, and lockfile checks pass |
| SEC-016 | Build provenance | Release artifact maps to approved source, workflow, and dependencies |
| SEC-017 | Secure update behavior | Interrupted, rolled-back, invalid-signature, and stale update tests |
| SEC-018 | Storage quota safety | Failed writes remain atomic and show recovery guidance |
| SEC-019 | Denial-of-service resistance | Extreme graph, rows, fields, and attachment corpus remains bounded |
| SEC-020 | External-link safety | Links require explicit action and cannot gain opener access |

## 12. Vulnerability severity and response

- **Critical:** active compromise, cross-tenant access, remote code execution, signing-key exposure, or widespread unrecoverable data loss. Block release and begin incident response immediately.
- **High:** likely unauthorized access, stored XSS, serious import escape, encryption failure, or major audit bypass. Block release unless the component is fully disabled and risk accepted by accountable owners.
- **Medium:** constrained exploit, meaningful data exposure, or defense-in-depth failure. Fix within the defined security service level.
- **Low:** limited impact or hardening opportunity. Track and schedule.

Public disclosure, coordinated remediation, and security contact processes must be documented before production distribution.

## 13. Compliance readiness

The architecture should support, without claiming certification before audit:

- Data inventory and processing records.
- Configurable retention and deletion.
- Access and audit exports.
- Organization policy enforcement.
- Regional hosting choices for future services.
- Backup, recovery, continuity, and incident evidence.
- Vendor and subprocessor inventory.
- Control mapping suitable for future ISO 27001, SOC 2, and applicable privacy-law assessments.

Compliance labels must never be used without verified scope and evidence.

## 14. Release gate

A release is blocked by:

- Unresolved critical or high security findings.
- Missing malicious-import regression coverage.
- Unexpected production network requests in offline mode.
- Missing SBOM or dependency vulnerability review.
- A security-sensitive feature without threat-model and test updates.
- Failure to restore safely after rejected, interrupted, or corrupted import.

Security must be demonstrated through evidence, not assumed from offline operation.