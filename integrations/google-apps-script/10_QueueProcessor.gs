function processMessageQueue() {
  return withDocumentLock_(() => {
    const startedAt = new Date();
    const context = loadContext_();
    const summary = {
      mode: context.config.DRY_RUN ? 'DRY_RUN' : 'LIVE',
      rowsScanned: 0,
      eligible: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
      result: 'NO_ACTION',
      details: '',
      triggerId: getCurrentTriggerId_(),
    };

    try {
      assertExecutionAllowed_(context);

      const lastRow = context.queueSheet.getLastRow();
      if (lastRow < 2) {
        summary.result = 'EMPTY_QUEUE';
        summary.details = 'No queue rows were found.';
        return finalizeRun_(context, startedAt, summary);
      }

      const rowCount = lastRow - 1;
      const range = context.queueSheet.getRange(2, 1, rowCount, CPM_AUTOMATION.REQUIRED_HEADERS.length);
      const values = range.getValues();
      const displayValues = range.getDisplayValues();
      summary.rowsScanned = values.length;

      const now = new Date();
      const remainingQuota = MailApp.getRemainingDailyQuota();
      const quotaBudget = Math.max(0, remainingQuota - context.config.MIN_QUOTA_RESERVE);
      const sendLimit = Math.min(context.config.MAX_EMAILS_PER_RUN, quotaBudget);
      let liveAttempts = 0;

      for (let index = 0; index < values.length; index += 1) {
        const rowNumber = index + 2;
        const row = mapRow_(context.headerMap, values[index], displayValues[index]);
        const decision = evaluateQueueRow_(context.config, row, now);

        if (!decision.eligible) {
          summary.skipped += 1;
          continue;
        }

        summary.eligible += 1;
        if (!context.config.DRY_RUN && liveAttempts >= sendLimit) {
          summary.skipped += 1;
          continue;
        }

        if (context.config.DRY_RUN) {
          updateQueueRow_(context.queueSheet, rowNumber, context.headerMap, {
            'Last Attempt At': now,
            'Delivery / Error Details': 'DRY RUN — eligible; no email sent. Scheduled for ' + formatDate_(row.scheduledSendAt, context.config.TIME_ZONE) + '.',
          });
          continue;
        }

        liveAttempts += 1;
        const attemptCount = row.attemptCount + 1;
        updateQueueRow_(context.queueSheet, rowNumber, context.headerMap, {
          'Send Status': context.config.STATUS_SENDING,
          'Attempt Count': attemptCount,
          'Last Attempt At': now,
          'Delivery / Error Details': 'Submitting through GmailApp from ' + context.config.SENDER_EMAIL + '.',
        });
        SpreadsheetApp.flush();

        try {
          const draft = GmailApp.createDraft(row.recipientEmail, row.subject, row.body, {
            from: context.config.SENDER_EMAIL,
            name: context.config.SENDER_NAME,
            replyTo: context.config.REPLY_TO_EMAIL,
          });
          const message = draft.send();
          const messageId = message && typeof message.getId === 'function' ? message.getId() : '';
          const sentAt = new Date();

          updateQueueRow_(context.queueSheet, rowNumber, context.headerMap, {
            'Sent At': sentAt,
            'Apps Script Message ID': messageId,
            'Delivery / Error Details': 'Submitted successfully through GmailApp from ' + context.config.SENDER_EMAIL + '.',
            'Send Status': context.config.STATUS_SENT,
          });
          summary.sent += 1;
        } catch (error) {
          const detail = errorMessage_(error);
          updateQueueRow_(context.queueSheet, rowNumber, context.headerMap, {
            'Delivery / Error Details': detail,
            'Send Status': context.config.STATUS_ERROR,
          });
          summary.errors += 1;
        }
      }

      if (summary.errors > 0) {
        summary.result = summary.sent > 0 ? 'PARTIAL' : 'FAILED';
      } else if (context.config.DRY_RUN) {
        summary.result = 'DRY_RUN_COMPLETE';
      } else if (summary.sent > 0) {
        summary.result = 'SENT';
      } else {
        summary.result = 'NO_ELIGIBLE_ROWS';
      }
      summary.details =
        'Scanned ' +
        summary.rowsScanned +
        '; eligible ' +
        summary.eligible +
        '; sent ' +
        summary.sent +
        '; skipped ' +
        summary.skipped +
        '; errors ' +
        summary.errors +
        '.';
      return finalizeRun_(context, startedAt, summary);
    } catch (error) {
      summary.errors += 1;
      summary.result = 'BLOCKED';
      summary.details = errorMessage_(error);
      return finalizeRun_(context, startedAt, summary);
    }
  });
}

