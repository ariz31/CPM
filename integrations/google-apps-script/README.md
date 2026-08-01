# Google Apps Script scheduled message queue

This directory contains the source for the Google Apps Script bound to the **Clients Tabulation List — CRM** spreadsheet.

The script reads approved rows from `Message Queue` and submits due email messages through Gmail using the configured `ceo@arizval.com` send-as identity. The spreadsheet remains the operational source of truth; the CPM web application does not send these messages directly.

## Safety defaults

The workbook is intentionally left with:

- `ENABLED = FALSE`
- `DRY_RUN = TRUE`
- `SENDER_ALIAS_VERIFIED = FALSE`
- existing queue rows set to `Ready to Send = No`

Live sending is blocked unless all of the following are true:

1. `ceo@arizval.com` appears in `GmailApp.getAliases()` for the account that owns the trigger.
2. A sender self-test has been received and its **From** header has been manually confirmed.
3. `SENDER_ALIAS_VERIFIED` is manually checked in `Automation Config`.
4. `ENABLED = TRUE` and `DRY_RUN = FALSE`.
5. The queue row is approved, due, within the configured weekday/hour window, and has not already been sent.

## Repository files

- `Code.gs` — queue processor, validation, self-test, trigger management, audit logging, and duplicate-send safeguards.
- `appsscript.json` — V8 runtime, Asia/Manila timezone, and required OAuth scopes.
- `.clasp.json.example` — optional clasp configuration template.

## Spreadsheet contract

The script expects these tabs:

- `Message Queue`
- `Automation Config`
- `Automation Log`

The exact `Message Queue` headers are validated before every run. Relevant operational fields include:

- `Ready to Send`
- `Scheduled Send At`
- `Sent At`
- `Apps Script Message ID`
- `Attempt Count`
- `Last Attempt At`
- `Delivery / Error Details`
- `Send Status`

The queue uses the following status values:

`Draft`, `Ready`, `Scheduled`, `Sending`, `Sent`, `Failed`, `Bounced`, `Cancelled`, `Hold`, and `Skipped`.

`STATUS_ERROR` in `Automation Config` must remain `Failed` so it matches the queue validation.

## Installation into the bound Apps Script project

### Apps Script editor

1. Open the CRM spreadsheet.
2. Choose **Extensions → Apps Script**.
3. Replace the default code with `Code.gs`.
4. Enable **Show appsscript.json manifest file** in Project Settings and replace it with this directory's `appsscript.json`.
5. Confirm the Apps Script project timezone is `Asia/Manila`.
6. Save and authorize the requested permissions.
7. Reload the spreadsheet to display the **CPM Automation** menu.

### clasp

1. Install and authenticate clasp.
2. Copy `.clasp.json.example` to `.clasp.json`.
3. Replace `REPLACE_WITH_BOUND_SCRIPT_ID` with the script ID shown in Apps Script Project Settings.
4. Run `clasp push` from this directory.

Do not commit the real `.clasp.json` if the project identifier should remain private.

## Controlled activation procedure

1. Keep `ENABLED = FALSE`, `DRY_RUN = TRUE`, and `SENDER_ALIAS_VERIFIED = FALSE`.
2. In Gmail settings for the trigger-owning account, configure and verify `ceo@arizval.com` under **Send mail as**.
3. From the spreadsheet, run **CPM Automation → Send sender self-test**.
4. Open the received test message and confirm the actual **From** address is `ceo@arizval.com`.
5. Manually check `SENDER_ALIAS_VERIFIED` in `Automation Config`.
6. Run **Validate configuration**. It must report `VALIDATION PASSED`.
7. Prepare one controlled queue row with a verified recipient, a future `Scheduled Send At`, `Ready to Send = Yes`, and `Send Status = Scheduled`.
8. Run **Run queue now** while `DRY_RUN = TRUE`. Confirm the row is reported as eligible and no email is sent.
9. Set `DRY_RUN = FALSE` and `ENABLED = TRUE` only for the controlled live test.
10. Run the queue once manually and verify `Sent At`, message ID, delivery details, and `Send Status = Sent`.
11. Install the time trigger only after the controlled live test succeeds.

## Scheduling behavior

The trigger checks the queue at the configured interval. A message is sent on the first eligible execution at or after `Scheduled Send At`; it is not guaranteed to run at the exact minute. With a 15-minute interval, a message scheduled for 10:03 may be processed around 10:15.

Dates and sending windows are evaluated in `Asia/Manila`.

## Duplicate and failure handling

Before Gmail submission, the row is changed to `Sending` and the attempt counter is incremented. After successful submission, the script records `Sent At`, the Gmail message ID, delivery details, and `Sent` status.

Rows with a sent timestamp or message ID are rejected. Rows at the attempt limit are also rejected until manually reviewed. An execution lock prevents overlapping trigger runs.

If execution stops after Gmail accepts a message but before the success fields are written, the row remains `Sending` and is not automatically retried. This conservative behavior favors duplicate prevention over automatic recovery; review the Gmail Sent folder and the audit log before changing the row.

## Audit trail

Every validation, dry run, self-test, and live run appends a record to `Automation Log`, including counts, result, details, and trigger ID. `LAST_RUN_AT`, `LAST_RUN_RESULT`, `LAST_VERIFIED_AT`, and `INSTALLED_TRIGGER_ID` are maintained in `Automation Config`.
