function sendSenderIdentitySelfTest() {
  return withDocumentLock_(() => {
    const context = loadContext_();
    const aliases = GmailApp.getAliases();
    if (aliases.indexOf(context.config.SENDER_EMAIL) === -1) {
      throw new Error('Cannot self-test: GmailApp does not list ' + context.config.SENDER_EMAIL + ' as an available alias.');
    }

    const timestamp = new Date();
    const subject = '[CPM self-test] Sender identity ' + formatDate_(timestamp, context.config.TIME_ZONE);
    const body =
      'This is a controlled CPM CRM automation self-test.\n\n' +
      'Expected From: ' +
      context.config.SENDER_EMAIL +
      '\nExpected Reply-To: ' +
      context.config.REPLY_TO_EMAIL +
      '\nScript version: ' +
      CPM_AUTOMATION.SCRIPT_VERSION +
      '\nTime zone: ' +
      context.config.TIME_ZONE +
      '\n\nDo not enable live sending until the received message headers confirm the expected From address.';

    const message = GmailApp.createDraft(context.config.SELF_TEST_RECIPIENT, subject, body, {
      from: context.config.SENDER_EMAIL,
      name: context.config.SENDER_NAME,
      replyTo: context.config.REPLY_TO_EMAIL,
    }).send();

    writeConfigValues_(context.configSheet, context.configRows, {
      LAST_VERIFIED_AT: timestamp,
      LAST_RUN_AT: timestamp,
      LAST_RUN_RESULT: 'SELF-TEST SENT — manually verify the received From header, then set SENDER_ALIAS_VERIFIED=TRUE.',
      SCRIPT_VERSION: CPM_AUTOMATION.SCRIPT_VERSION,
    });

    appendAutomationLog_(context, {
      mode: 'SELF_TEST',
      rowsScanned: 0,
      eligible: 0,
      sent: 1,
      skipped: 0,
      errors: 0,
      result: 'SENT',
      details: 'Self-test sent to ' + context.config.SELF_TEST_RECIPIENT + '.',
      triggerId: getCurrentTriggerId_(),
    });

    SpreadsheetApp.getUi().alert(
      'Self-test sent. Confirm that the received From header is ' +
        context.config.SENDER_EMAIL +
        ', then manually set SENDER_ALIAS_VERIFIED=TRUE before enabling live sending.',
    );
    return message && typeof message.getId === 'function' ? message.getId() : '';
  });
}

function installQueueTrigger() {
  return withDocumentLock_(() => {
    const context = loadContext_();
    removeQueueTriggers_();
    const interval = context.config.TRIGGER_INTERVAL_MINUTES;
    const allowedIntervals = [1, 5, 10, 15, 30];
    if (allowedIntervals.indexOf(interval) === -1) {
      throw new Error('TRIGGER_INTERVAL_MINUTES must be one of: ' + allowedIntervals.join(', ') + '.');
    }

    const trigger = ScriptApp.newTrigger('processMessageQueue').timeBased().everyMinutes(interval).create();
    writeConfigValues_(context.configSheet, context.configRows, {
      INSTALLED_TRIGGER_ID: trigger.getUniqueId(),
      SCRIPT_VERSION: CPM_AUTOMATION.SCRIPT_VERSION,
    });
    SpreadsheetApp.getUi().alert('Queue trigger installed for every ' + interval + ' minutes.');
    return trigger.getUniqueId();
  });
}

function removeQueueTriggers() {
  return withDocumentLock_(() => {
    const context = loadContext_();
    const removed = removeQueueTriggers_();
    writeConfigValues_(context.configSheet, context.configRows, { INSTALLED_TRIGGER_ID: '' });
    SpreadsheetApp.getUi().alert('Removed ' + removed + ' queue trigger(s).');
    return removed;
  });
}

function removeQueueTriggers_() {
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (trigger.getHandlerFunction() === 'processMessageQueue') {
      ScriptApp.deleteTrigger(trigger);
      removed += 1;
    }
  });
  return removed;
}

function loadContext_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = spreadsheet.getSheetByName(CPM_AUTOMATION.CONFIG_SHEET);
  if (!configSheet) {
    throw new Error('Missing sheet: ' + CPM_AUTOMATION.CONFIG_SHEET);
  }

  const configData = configSheet.getDataRange().getValues();
  const configRows = {};
  const rawConfig = {};
  for (let rowIndex = 1; rowIndex < configData.length; rowIndex += 1) {
    const key = String(configData[rowIndex][0] || '').trim();
    if (!key) continue;
    rawConfig[key] = configData[rowIndex][1];
    configRows[key] = rowIndex + 1;
  }

  const config = normalizeConfig_(rawConfig);
  if (config.SPREADSHEET_ID && config.SPREADSHEET_ID !== spreadsheet.getId()) {
    throw new Error('SPREADSHEET_ID does not match the active spreadsheet.');
  }

  const queueSheet = spreadsheet.getSheetByName(config.MESSAGE_QUEUE_SHEET);
  if (!queueSheet) {
    throw new Error('Missing queue sheet: ' + config.MESSAGE_QUEUE_SHEET);
  }

  const headerValues = queueSheet.getRange(1, 1, 1, CPM_AUTOMATION.REQUIRED_HEADERS.length).getDisplayValues()[0];
  const headerMap = buildHeaderMap_(headerValues);
  CPM_AUTOMATION.REQUIRED_HEADERS.forEach((header) => {
    if (!headerMap[header]) {
      throw new Error('Missing required Message Queue header: ' + header);
    }
  });

  return {
    spreadsheet: spreadsheet,
    configSheet: configSheet,
    configRows: configRows,
    config: config,
    queueSheet: queueSheet,
    headerMap: headerMap,
  };
}

function normalizeConfig_(raw) {
  const config = Object.assign({}, raw);
  config.ENABLED = toBoolean_(raw.ENABLED);
  config.DRY_RUN = toBoolean_(raw.DRY_RUN);
  config.SENDER_ALIAS_VERIFIED = toBoolean_(raw.SENDER_ALIAS_VERIFIED);
  config.TRIGGER_INTERVAL_MINUTES = toPositiveInteger_(raw.TRIGGER_INTERVAL_MINUTES, 'TRIGGER_INTERVAL_MINUTES');
  config.MAX_EMAILS_PER_RUN = toPositiveInteger_(raw.MAX_EMAILS_PER_RUN, 'MAX_EMAILS_PER_RUN');
  config.MAX_ATTEMPTS = toPositiveInteger_(raw.MAX_ATTEMPTS, 'MAX_ATTEMPTS');
  config.MIN_QUOTA_RESERVE = toNonNegativeInteger_(raw.MIN_QUOTA_RESERVE, 'MIN_QUOTA_RESERVE');
  config.SEND_WINDOW_START_HOUR = toHour_(raw.SEND_WINDOW_START_HOUR, 'SEND_WINDOW_START_HOUR');
  config.SEND_WINDOW_END_HOUR = toHour_(raw.SEND_WINDOW_END_HOUR, 'SEND_WINDOW_END_HOUR');
  config.ALLOWED_WEEKDAYS = splitList_(raw.ALLOWED_WEEKDAYS).map((value) => value.toUpperCase());
  config.ALLOWED_SEND_STATUSES = splitList_(raw.ALLOWED_SEND_STATUSES);
  config.AUTOMATION_LOG_SHEET = String(raw.AUTOMATION_LOG_SHEET || CPM_AUTOMATION.DEFAULT_LOG_SHEET).trim();

  [
    'MESSAGE_QUEUE_SHEET',
    'SENDER_EMAIL',
    'SENDER_NAME',
    'REPLY_TO_EMAIL',
    'TIME_ZONE',
    'REQUIRED_READY_VALUE',
    'STATUS_SENDING',
    'STATUS_SENT',
    'STATUS_ERROR',
    'SELF_TEST_RECIPIENT',
  ].forEach((key) => {
    if (!String(config[key] || '').trim()) {
      throw new Error('Missing required configuration: ' + key);
    }
    config[key] = String(config[key]).trim();
  });

  if (config.SEND_WINDOW_END_HOUR <= config.SEND_WINDOW_START_HOUR) {
    throw new Error('SEND_WINDOW_END_HOUR must be greater than SEND_WINDOW_START_HOUR.');
  }
  return config;
}

function assertExecutionAllowed_(context) {
  const config = context.config;
  if (!config.ENABLED && !config.DRY_RUN) {
    throw new Error('Automation is disabled. Set ENABLED=TRUE only after validation and sender self-test.');
  }
  if (!config.DRY_RUN) {
    const aliases = GmailApp.getAliases();
    if (aliases.indexOf(config.SENDER_EMAIL) === -1) {
      throw new Error('Live sending blocked: sender alias is unavailable: ' + config.SENDER_EMAIL);
    }
    if (!config.SENDER_ALIAS_VERIFIED) {
      throw new Error('Live sending blocked: SENDER_ALIAS_VERIFIED is FALSE.');
    }
  }
}

