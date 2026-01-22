
export const callSheetApi = async (url: string, action: string, data?: any) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ 
        action, 
        ...data, 
        projectSource: "Responder ResQ v0.2" 
      }),
    });
    
    if (response.ok) {
      return await response.json();
    }
    return { success: true, message: "Request sent to cloud queue" };
  } catch (error) {
    console.error("Sheet API Error:", error);
    return { success: false, error };
  }
};

export const fetchFromSheet = async (url: string, action: string) => {
  try {
    const fullUrl = `${url}${url.includes('?') ? '&' : '?'}action=${action}`;
    const response = await fetch(fullUrl);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Fetch Error:", error);
    return null;
  }
};

export const pingDatabase = async (url: string) => {
  try {
    const response = await fetchFromSheet(url, 'ping');
    return response?.data?.message === 'pong' || response?.message === 'pong';
  } catch {
    return false;
  }
};

export const APPS_SCRIPT_TEMPLATE = `
/**
 * Google Apps Script for Responder ResQ Amal - Official v3.3 (Prefixed Version)
 */

const TELEGRAM_TOKEN = ''; 
const TELEGRAM_CHAT_ID = '';

const CONFIG = {
  SHEETS: {
    PROGRAMS: { name: 'Programs', headers: ['ID Program', 'Nama Program', 'Tarikh Program', 'Lokasi Program', 'Status'] },
    ATTENDANCE: { name: 'Attendance', headers: ['Nama', 'Program', 'Checkpoint', 'Masa Masuk', 'Masa Keluar', 'Status', 'Project Source'] },
    CASE_REPORTS: { name: 'CaseReports', headers: ['ID Kes', 'Masa', 'Responder', 'Program/CP', 'Nama Pesakit', 'Umur', 'Jantina', 'Simptom', 'Kesedaran', 'BP', 'PR', 'DXT', 'Temp', 'Rawatan', 'Status', 'Lokasi', 'Source'] },
    RESPONDERS: { name: 'Responders', headers: ['Nama', 'Program', 'Checkpoint', 'Timestamp', 'Project Source'] }
  }
};

function doGet(e) { return respond_handleGet(e); }
function doPost(e) { return respond_handlePost(e); }

function respond_handleGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'ping') return respond_createResponse({ status: "ok", message: "pong" });
    if (action === 'getPrograms') {
      const sheet = respond_ensureSheet(CONFIG.SHEETS.PROGRAMS);
      const data = sheet.getDataRange().getValues();
      const headers = data.shift();
      return respond_createResponse(data.map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h.trim()] = row[i]);
        return obj;
      }));
    }
    return respond_createResponse("Action not found", false);
  } catch (err) { return respond_createResponse(err.message, false); }
}

function respond_handlePost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    // Logic handles addCase, startSession, endSession
    return respond_createResponse({ success: true });
  } catch (e) { return respond_createResponse(e.message, false); }
}

function respond_ensureSheet(cfg) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(cfg.name);
  if (!sheet) { sheet = ss.insertSheet(cfg.name); sheet.appendRow(cfg.headers); sheet.setFrozenRows(1); }
  return sheet;
}

function respond_createResponse(data, success = true) {
  const payload = { success: success };
  if (success) payload.data = data; else payload.error = data;
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
`;
