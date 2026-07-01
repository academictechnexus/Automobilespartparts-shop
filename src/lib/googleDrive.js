/**
 * AutoSpares Pro — Google Drive Backup
 * Uses Google Drive API (free, no cost)
 * Data saved to user's OWN Google Drive — not our servers
 * Folder: "AutoSpares Pro Backup" in their Drive
 */

const CLIENT_ID     = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const API_KEY       = process.env.REACT_APP_GOOGLE_API_KEY   || '';
const SCOPES        = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME   = 'AutoSpares Pro Backup';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let gapiLoaded   = false;
let gisLoaded    = false;
let tokenClient  = null;
let folderId     = null;

// ─── LOAD GOOGLE SCRIPTS ──────────────────────────────────────────────────────
export const loadGoogleScripts = () => new Promise((resolve) => {
  // Load GAPI
  const gapiScript = document.createElement('script');
  gapiScript.src = 'https://apis.google.com/js/api.js';
  gapiScript.onload = () => {
    window.gapi.load('client', async () => {
      await window.gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
      gapiLoaded = true;
      if (gisLoaded) resolve(true);
    });
  };
  document.body.appendChild(gapiScript);

  // Load GIS (Google Identity Services)
  const gisScript = document.createElement('script');
  gisScript.src = 'https://accounts.google.com/gsi/client';
  gisScript.onload = () => {
    gisLoaded = true;
    if (gapiLoaded) resolve(true);
  };
  document.body.appendChild(gisScript);
});

// ─── SIGN IN ──────────────────────────────────────────────────────────────────
export const signInGoogle = () => new Promise((resolve, reject) => {
  if (!CLIENT_ID) { reject(new Error('Google Client ID not configured')); return; }
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error) { reject(response); return; }
      localStorage.setItem('gdrive_token', response.access_token);
      localStorage.setItem('gdrive_token_expiry', String(Date.now() + (response.expires_in * 1000)));
      localStorage.setItem('gdrive_connected', 'true');
      resolve(response);
    },
  });
  tokenClient.requestAccessToken({ prompt: 'consent' });
});

// ─── SIGN OUT ─────────────────────────────────────────────────────────────────
export const signOutGoogle = () => {
  const token = localStorage.getItem('gdrive_token');
  if (token && window.google) {
    window.google.accounts.oauth2.revoke(token);
  }
  localStorage.removeItem('gdrive_token');
  localStorage.removeItem('gdrive_token_expiry');
  localStorage.removeItem('gdrive_connected');
  localStorage.removeItem('gdrive_folder_id');
  folderId = null;
};

// ─── CHECK IF CONNECTED ───────────────────────────────────────────────────────
export const isGoogleConnected = () => {
  const connected = localStorage.getItem('gdrive_connected') === 'true';
  const expiry    = parseInt(localStorage.getItem('gdrive_token_expiry') || '0');
  return connected && Date.now() < expiry;
};

export const getGoogleEmail = () => localStorage.getItem('gdrive_email') || '';

// ─── SET AUTH TOKEN ───────────────────────────────────────────────────────────
const setAuthToken = () => {
  const token = localStorage.getItem('gdrive_token');
  if (token && window.gapi?.client) {
    window.gapi.client.setToken({ access_token: token });
  }
};

// ─── GET OR CREATE BACKUP FOLDER ─────────────────────────────────────────────
const getOrCreateFolder = async (shopName) => {
  if (folderId) return folderId;
  
  const saved = localStorage.getItem('gdrive_folder_id');
  if (saved) { folderId = saved; return folderId; }

  setAuthToken();
  const folderFullName = `${FOLDER_NAME} — ${shopName || 'My Shop'}`;

  // Search for existing folder
  try {
    const search = await window.gapi.client.drive.files.list({
      q: `name='${folderFullName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (search.result.files?.length > 0) {
      folderId = search.result.files[0].id;
      localStorage.setItem('gdrive_folder_id', folderId);
      return folderId;
    }
  } catch {}

  // Create new folder
  const folder = await window.gapi.client.drive.files.create({
    resource: { name: folderFullName, mimeType: 'application/vnd.google-apps.folder' },
    fields: 'id',
  });

  folderId = folder.result.id;
  localStorage.setItem('gdrive_folder_id', folderId);
  return folderId;
};

// ─── UPLOAD FILE TO DRIVE ─────────────────────────────────────────────────────
const uploadToDrive = async (filename, content, mimeType, shopName) => {
  setAuthToken();
  const folder = await getOrCreateFolder(shopName);

  // Check if file already exists (for overwrite)
  let existingId = null;
  try {
    const search = await window.gapi.client.drive.files.list({
      q: `name='${filename}' and '${folder}' in parents and trashed=false`,
      fields: 'files(id)',
    });
    if (search.result.files?.length > 0) {
      existingId = search.result.files[0].id;
    }
  } catch {}

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = JSON.stringify({ name: filename, parents: existingId ? undefined : [folder] });

  const multipartBody =
    delimiter + 'Content-Type: application/json\r\n\r\n' + metadata +
    delimiter + `Content-Type: ${mimeType}\r\n\r\n` + content +
    closeDelimiter;

  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  const method = existingId ? 'PATCH' : 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('gdrive_token')}`,
      'Content-Type': `multipart/related; boundary="${boundary}"`,
    },
    body: multipartBody,
  });

  if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
  return await response.json();
};

// ─── MAIN BACKUP FUNCTIONS ────────────────────────────────────────────────────

export const backupToGoogleDrive = async (allData, shopName) => {
  if (!isGoogleConnected()) throw new Error('Not connected to Google Drive');

  const timestamp  = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dateStr    = new Date().toLocaleDateString('en-IN');
  const results    = [];

  // 1. Full JSON backup
  const jsonContent = JSON.stringify({
    version:    '4.0',
    shop:       shopName,
    created_at: new Date().toISOString(),
    data:       allData,
  }, null, 2);

  const jsonFile = await uploadToDrive(
    `autospares_backup_${timestamp}.json`,
    jsonContent,
    'application/json',
    shopName
  );
  results.push({ type: 'JSON Backup', file: jsonFile.name || 'backup.json' });

  // 2. Invoices Excel (latest always overwrites)
  const invoiceCSV = generateCSV(allData.invoices || [], [
    'invoice_no','invoice_type','invoice_date','customer_name','customer_gstin',
    'subtotal','discount_amt','taxable_amt','cgst_amt','sgst_amt','igst_amt',
    'total_gst','grand_total','paid_amount','balance_due','payment_mode','status','supply_type'
  ]);
  await uploadToDrive(`Invoices_Latest.csv`, invoiceCSV, 'text/csv', shopName);
  results.push({ type: 'Invoices CSV', file: 'Invoices_Latest.csv' });

  // 3. Inventory CSV
  const inventoryCSV = generateCSV(allData.parts || [], [
    'code','name','brand','make','model','year_range','category','hsn_code',
    'gst_rate','purchase_price','selling_price','mrp','stock','reorder_level',
    'location','part_type','unit','warranty_months','batch_no','country_origin'
  ]);
  await uploadToDrive('Inventory_Latest.csv', inventoryCSV, 'text/csv', shopName);
  results.push({ type: 'Inventory CSV', file: 'Inventory_Latest.csv' });

  // 4. Customers CSV
  const customerCSV = generateCSV(allData.customers || [], [
    'name','phone','email','address','city','gst_no','customer_type','credit_limit','balance'
  ]);
  await uploadToDrive('Customers_Latest.csv', customerCSV, 'text/csv', shopName);
  results.push({ type: 'Customers CSV', file: 'Customers_Latest.csv' });

  // Save backup log
  const log = getBackupLog();
  log.unshift({
    timestamp:  new Date().toISOString(),
    type:       'Google Drive',
    files:      results.length,
    status:     'success',
    shop:       shopName,
  });
  localStorage.setItem('backup_log', JSON.stringify(log.slice(0, 50)));

  return results;
};

// ─── CSV GENERATOR ────────────────────────────────────────────────────────────
const generateCSV = (rows, columns) => {
  const header = columns.join(',');
  const data   = rows.map(row =>
    columns.map(col => {
      const val = row[col] ?? '';
      return typeof val === 'string' && (val.includes(',') || val.includes('"'))
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(',')
  );
  return [header, ...data].join('\r\n');
};

// ─── BACKUP LOG ───────────────────────────────────────────────────────────────
export const getBackupLog = () => {
  try { return JSON.parse(localStorage.getItem('backup_log') || '[]'); } catch { return []; }
};

export const getLastBackupTime = () => {
  const log = getBackupLog();
  return log[0]?.timestamp || null;
};

export const isDueForBackup = () => {
  const last = getLastBackupTime();
  if (!last) return true;
  const hoursSince = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60);
  return hoursSince > 24;
};
