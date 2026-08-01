function evaluateQueueRow_(config, row, now) {
  if (!row.crmId) return { eligible: false, reason: 'blank CRM ID' };
  if (row.readyToSend !== config.REQUIRED_READY_VALUE) return { eligible: false, reason: 'not approved' };
  if (config.ALLOWED_SEND_STATUSES.indexOf(row.sendStatus) === -1) return { eligible: false, reason: 'status not eligible' };
  if (row.preferredChannel !== 'Email') return { eligible: false, reason: 'channel is not Email' };
  if (!isValidEmail_(row.recipientEmail)) return { eligible: false, reason: 'invalid recipient email' };
  if (!row.subject) return { eligible: false, reason: 'missing subject' };
  if (!row.body) return { eligible: false, reason: 'missing message' };
  if (!(row.scheduledSendAt instanceof Date) || isNaN(row.scheduledSendAt.getTime())) {
    return { eligible: false, reason: 'invalid schedule' };
  }
  if (row.scheduledSendAt.getTime() > now.getTime()) return { eligible: false, reason: 'not due' };
  if (row.sentAt || row.messageId) return { eligible: false, reason: 'already sent' };
  if (row.attemptCount >= config.MAX_ATTEMPTS) return { eligible: false, reason: 'attempt limit reached' };
  if (!isWithinSendWindow_(now, config)) return { eligible: false, reason: 'outside send window' };
  return { eligible: true, reason: 'eligible' };
}

function isWithinSendWindow_(date, config) {
  const weekday = Utilities.formatDate(date, config.TIME_ZONE, 'EEE').toUpperCase();
  const hour = Number(Utilities.formatDate(date, config.TIME_ZONE, 'H'));
  return (
    config.ALLOWED_WEEKDAYS.indexOf(weekday) !== -1 &&
    hour >= config.SEND_WINDOW_START_HOUR &&
    hour < config.SEND_WINDOW_END_HOUR
  );
}

function mapRow_(headerMap, values, displayValues) {
  const value = (header) => values[headerMap[header] - 1];
  const display = (header) => String(displayValues[headerMap[header] - 1] || '').trim();
  return {
    crmId: display('CRM ID'),
    body: display('Custom Message'),
    subject: display('Email Subject'),
    recipientEmail: display('Recipient Email (verify one)'),
    preferredChannel: display('Preferred Channel'),
    readyToSend: display('Ready to Send'),
    scheduledSendAt: value('Scheduled Send At'),
    sentAt: value('Sent At'),
    messageId: display('Apps Script Message ID'),
    attemptCount: Number(value('Attempt Count') || 0),
    sendStatus: display('Send Status'),
  };
}

function updateQueueRow_(sheet, rowNumber, headerMap, changes) {
  Object.keys(changes).forEach((header) => {
    if (!headerMap[header]) throw new Error('Cannot update unknown queue header: ' + header);
    sheet.getRange(rowNumber, headerMap[header]).setValue(changes[header]);
  });
}

function finalizeRun_(context, startedAt, summary) {
  const finishedAt = new Date();
  writeConfigValues_(context.configSheet, context.configRows, {
    LAST_RUN_AT: finishedAt,
    LAST_RUN_RESULT: summary.result + ' — ' + summary.details,
    SCRIPT_VERSION: CPM_AUTOMATION.SCRIPT_VERSION,
  });
  appendAutomationLog_(context, Object.assign({}, summary, { startedAt: startedAt, finishedAt: finishedAt }));
  return summary;
}

function appendAutomationLog_(context, summary) {
  let sheet = context.spreadsheet.getSheetByName(context.config.AUTOMATION_LOG_SHEET);
  if (!sheet) {
    sheet = context.spreadsheet.insertSheet(context.config.AUTOMATION_LOG_SHEET);
    sheet.getRange(1, 1, 1, 12).setValues([[
      'Run ID',
      'Started At',
      'Finished At',
      'Mode',
      'Rows Scanned',
      'Eligible',
      'Sent',
      'Skipped',
      'Errors',
      'Result',
      'Details',
      'Trigger ID',
    ]]);
    sheet.setFrozenRows(1);
  }

  const startedAt = summary.startedAt || new Date();
  const finishedAt = summary.finishedAt || new Date();
  sheet.appendRow([
    Utilities.getUuid(),
    startedAt,
    finishedAt,
    summary.mode || '',
    summary.rowsScanned || 0,
    summary.eligible || 0,
    summary.sent || 0,
    summary.skipped || 0,
    summary.errors || 0,
    summary.result || '',
    truncate_(summary.details || '', CPM_AUTOMATION.MAX_DETAIL_LENGTH),
    summary.triggerId || '',
  ]);
}

function writeConfigValues_(sheet, rowMap, changes) {
  Object.keys(changes).forEach((key) => {
    if (!rowMap[key]) return;
    sheet.getRange(rowMap[key], 2).setValue(changes[key]);
  });
}

function buildHeaderMap_(headers) {
  const map = {};
  headers.forEach((header, index) => {
    const normalized = String(header || '').trim();
    if (normalized) map[normalized] = index + 1;
  });
  return map;
}

function findQueueTrigger_() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let index = 0; index < triggers.length; index += 1) {
    if (triggers[index].getHandlerFunction() === 'processMessageQueue') return triggers[index];
  }
  return null;
}

function getCurrentTriggerId_() {
  const trigger = findQueueTrigger_();
  return trigger ? trigger.getUniqueId() : '';
}

function withDocumentLock_(callback) {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(CPM_AUTOMATION.LOCK_WAIT_MS)) {
    throw new Error('Another CPM automation execution is already running.');
  }
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function splitList_(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toBoolean_(value) {
  if (value === true || value === false) return value;
  return String(value).trim().toUpperCase() === 'TRUE';
}

function toPositiveInteger_(value, key) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) throw new Error(key + ' must be a positive integer.');
  return number;
}

function toNonNegativeInteger_(value, key) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) throw new Error(key + ' must be a non-negative integer.');
  return number;
}

function toHour_(value, key) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 23) throw new Error(key + ' must be an integer from 0 to 23.');
  return number;
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function formatDate_(date, timeZone) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'invalid date';
  return Utilities.formatDate(date, timeZone, 'yyyy-MM-dd HH:mm:ss');
}

function errorMessage_(error) {
  const message = error && error.message ? error.message : String(error);
  return truncate_(message, CPM_AUTOMATION.MAX_DETAIL_LENGTH);
}

function truncate_(value, maxLength) {
  const text = String(value || '');
  return text.length <= maxLength ? text : text.slice(0, maxLength - 1) + '…';
}
