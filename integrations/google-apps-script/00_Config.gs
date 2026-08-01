/**
 * CPM CRM scheduled email queue.
 * Source of truth: Automation Config and Message Queue sheets.
 */

const CPM_AUTOMATION = Object.freeze({
  CONFIG_SHEET: 'Automation Config',
  DEFAULT_LOG_SHEET: 'Automation Log',
  REQUIRED_HEADERS: Object.freeze([
    'CRM ID',
    'Custom Message',
    'Email Subject',
    'Company',
    'Recipient Name',
    'Recipient Email (verify one)',
    'Country',
    'Website',
    'Target Contact Role',
    'Preferred Channel',
    'Message Type',
    'Ready to Send',
    'Scheduled Send At',
    'Sent At',
    'Apps Script Message ID',
    'Attempt Count',
    'Last Attempt At',
    'Delivery / Error Details',
    'Reply Status',
    'Reply Received At',
    'Next Follow-up Date',
    'Follow-up Count',
    'Notes',
    'Send Status',
  ]),
  SCRIPT_VERSION: '1.0.0',
  LOCK_WAIT_MS: 5000,
  MAX_DETAIL_LENGTH: 5000,
});

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('CPM Automation')
    .addItem('Validate configuration', 'validateAutomationSetup')
    .addItem('Run queue now', 'processMessageQueue')
    .addSeparator()
    .addItem('Send sender self-test', 'sendSenderIdentitySelfTest')
    .addSeparator()
    .addItem('Install queue trigger', 'installQueueTrigger')
    .addItem('Remove queue triggers', 'removeQueueTriggers')
    .addToUi();
}

function validateAutomationSetup() {
  const result = withDocumentLock_(() => {
    const context = loadContext_();
    const aliases = GmailApp.getAliases();
    const senderVerified = aliases.indexOf(context.config.SENDER_EMAIL) !== -1;
    const trigger = findQueueTrigger_();
    const issues = [];

    if (!senderVerified) {
      issues.push('Sender alias is not available to GmailApp: ' + context.config.SENDER_EMAIL);
    }
    if (context.spreadsheet.getSpreadsheetTimeZone() !== context.config.TIME_ZONE) {
      issues.push(
        'Spreadsheet time zone is ' +
          context.spreadsheet.getSpreadsheetTimeZone() +
          ', expected ' +
          context.config.TIME_ZONE,
      );
    }
    if (Session.getScriptTimeZone() !== context.config.TIME_ZONE) {
      issues.push(
        'Apps Script time zone is ' + Session.getScriptTimeZone() + ', expected ' + context.config.TIME_ZONE,
      );
    }

    const manualConfirmation = context.config.SENDER_ALIAS_VERIFIED;
    if (senderVerified && !manualConfirmation) {
      issues.push('Sender alias is available, but SENDER_ALIAS_VERIFIED remains FALSE pending manual confirmation of the received self-test From header.');
    }

    writeConfigValues_(context.configSheet, context.configRows, {
      LAST_VERIFIED_AT: new Date(),
      LAST_RUN_RESULT: issues.length ? 'VALIDATION BLOCKED — ' + issues.join(' | ') : 'VALIDATION PASSED',
      INSTALLED_TRIGGER_ID: trigger ? trigger.getUniqueId() : '',
      SCRIPT_VERSION: CPM_AUTOMATION.SCRIPT_VERSION,
    });

    appendAutomationLog_(context, {
      mode: 'VALIDATE',
      rowsScanned: 0,
      eligible: 0,
      sent: 0,
      skipped: 0,
      errors: issues.length,
      result: issues.length ? 'BLOCKED' : 'PASSED',
      details: issues.join(' | ') || 'Configuration and sender identity checks passed.',
      triggerId: trigger ? trigger.getUniqueId() : '',
    });

    return { ok: issues.length === 0, issues: issues };
  });

  if (result.ok) {
    SpreadsheetApp.getUi().alert('CPM automation validation passed.');
  } else {
    SpreadsheetApp.getUi().alert('CPM automation is blocked:\n\n' + result.issues.join('\n'));
  }
  return result;
}

