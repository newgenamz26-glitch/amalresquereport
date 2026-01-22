
/**
 * Google Apps Script for Responder ResQ Amal - Official v3.3 (Prefixed Version)
 */

// --- CONFIGURATION ---
const TELEGRAM_TOKEN = ''; 
const TELEGRAM_CHAT_ID = '';

const CONFIG = {
  SHEETS: {
    PROGRAMS: {
      name: 'Programs',
      headers: ['ID Program', 'Nama Program', 'Tarikh Program', 'Lokasi Program', 'Status']
    },
    ATTENDANCE: {
      name: 'Attendance',
      headers: ['Nama', 'Program', 'Checkpoint', 'Masa Masuk', 'Masa Keluar', 'Status', 'Project Source']
    },
    CASE_REPORTS: {
      name: 'CaseReports',
      headers: ['ID Kes', 'Masa', 'Responder', 'Program/CP', 'Nama Pesakit', 'Umur', 'Jantina', 'Simptom', 'Kesedaran', 'BP', 'PR', 'DXT', 'Temp', 'Rawatan', 'Status', 'Lokasi', 'Source']
    },
    RESPONDERS: {
      name: 'Responders',
      headers: ['Nama', 'Program', 'Checkpoint', 'Timestamp', 'Project Source']
    }
  }
};

/**
 * Standard Entry Point - GET
 */
function doGet(e) {
  return respond_handleGet(e);
}

/**
 * Standard Entry Point - POST
 */
function doPost(e) {
  return respond_handlePost(e);
}

/**
 * Prefixed GET Handler
 */
function respond_handleGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    if (action === 'ping') {
      return respond_createResponse({ status: "ok", message: "pong", timestamp: new Date().toISOString() });
    }

    if (action === 'getPrograms') {
      const sheet = respond_ensureSheet(CONFIG.SHEETS.PROGRAMS);
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return respond_createResponse([]);
      const headers = data.shift();
      const mappedData = data.map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h.trim()] = row[i]);
        return obj;
      });
      return respond_createResponse(mappedData);
    }

    if (action === 'getAttendance') {
      const sheet = respond_ensureSheet(CONFIG.SHEETS.ATTENDANCE);
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return respond_createResponse([]);
      const headers = data.shift();
      const result = data.map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h.trim()] = row[i]);
        return obj;
      });
      return respond_createResponse(result.reverse().slice(0, 20));
    }

    if (action === 'getRecentCases') {
      const sheet = respond_ensureSheet(CONFIG.SHEETS.CASE_REPORTS);
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return respond_createResponse([]);
      const startRow = Math.max(2, lastRow - 14);
      const numRows = lastRow - startRow + 1;
      const data = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn()).getValues();
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const result = data.reverse().map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h.trim()] = row[i]);
        return obj;
      });
      return respond_createResponse(result);
    }

    return respond_createResponse("Action not found: " + action, false);
  } catch (err) {
    return respond_createResponse(err.message, false);
  }
}

/**
 * Prefixed POST Handler
 */
function respond_handlePost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond_createResponse("Invalid JSON", false);
  }

  const action = payload.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const source = payload.projectSource || "Unknown Project";
  
  try {
    if (action === 'addCase') {
      const sheet = respond_ensureSheet(CONFIG.SHEETS.CASE_REPORTS);
      const timestampStr = new Date(payload.timestamp).toLocaleString('ms-MY');
      sheet.appendRow([
        payload.idKes, timestampStr, payload.recordedBy, payload.programCP,
        payload.p_name, payload.p_age, payload.p_gender, payload.symptoms,
        payload.kesedaran, payload.vitalBP, payload.vitalPR, payload.vitalDXT, payload.vitalTemp,
        payload.treatment, payload.statusAkhir, 
        payload.location ? payload.location.lat + ', ' + payload.location.lng : 'N/A',
        source
      ]);

      if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
        try { respond_sendTelegramNotification(payload, timestampStr); } catch (err) {}
      }
      return respond_createResponse({ success: true, idKes: payload.idKes });
    }

    if (action === 'startSession') {
      const respSheet = respond_ensureSheet(CONFIG.SHEETS.RESPONDERS);
      respSheet.appendRow([payload.name, payload.programName, payload.checkpoint, new Date().toLocaleString('ms-MY'), source]);
      const attSheet = respond_ensureSheet(CONFIG.SHEETS.ATTENDANCE);
      attSheet.appendRow([payload.name, payload.programName, payload.checkpoint, new Date().toLocaleString('ms-MY'), '-', 'Bertugas', source]);
      return respond_createResponse({ success: true });
    }

    if (action === 'endSession') {
      const attSheet = ss.getSheetByName(CONFIG.SHEETS.ATTENDANCE.name);
      if (attSheet) {
        const data = attSheet.getDataRange().getValues();
        const hMap = respond_getHeaderMap(attSheet);
        const sName = String(payload.name).trim().toLowerCase();
        const sCP = String(payload.checkpoint).trim().toLowerCase();
        for (let i = data.length - 1; i >= 1; i--) {
          const rowName = String(data[i][hMap['Nama']]).trim().toLowerCase();
          const rowCP = String(data[i][hMap['Checkpoint']]).trim().toLowerCase();
          const rowStatus = String(data[i][hMap['Status']]).trim();
          if (rowName === sName && rowCP === sCP && rowStatus === 'Bertugas') {
            attSheet.getRange(i + 1, hMap['Masa Keluar'] + 1).setValue(new Date().toLocaleString('ms-MY'));
            attSheet.getRange(i + 1, hMap['Status'] + 1).setValue('Tamat');
            break;
          }
        }
      }
      return respond_createResponse({ success: true });
    }

    return respond_createResponse("POST Action not found: " + action, false);
  } catch (err) {
    return respond_createResponse(err.message, false);
  }
}

/** 
 * INTERNAL HELPERS
 */
function respond_ensureSheet(sheetConfig) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetConfig.name);
  if (!sheet) {
    sheet = ss.insertSheet(sheetConfig.name);
    sheet.appendRow(sheetConfig.headers);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(sheetConfig.headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function respond_getHeaderMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let map = {};
  headers.forEach((h, i) => map[h.trim()] = i);
  return map;
}

function respond_sendTelegramNotification(p, time) {
  const message = `🚨 *LAPORAN KES BARU: ${p.idKes}* 🚨\n👤 *Responder:* ${p.recordedBy}\n📍 *CP:* ${p.programCP}\n🏥 *Pesakit:* ${p.p_name}\n✅ *STATUS:* ${p.statusAkhir}`;
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' })
  });
}

function respond_createResponse(data, success = true) {
  const payload = { success: success };
  if (success) {
    payload.data = data;
  } else {
    payload.error = data;
  }
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
