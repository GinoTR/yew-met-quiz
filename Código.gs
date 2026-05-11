// CONFIGURACIÓN
const SHEET_ID = '1JPYGqlynR3mLNc9Wc243eg94WcsLz8VwdeZMlmtZWD8';
const USER_VOICE_FOLDER_ID = '1frz7u-dHyejDu2kMDWwORKZgmTCLuBUI';
const NOTIFICATION_EMAIL = 'yourenglishworld.dianagranados@gmail.com';

const COLUMNS = [
  'Time', 'User', 'Email', 'Part N°', 'File', 'ReadingText',
  'Question', 'Type', 'UserChoice', 'UserText', 'UserVoice',
  'CorrectAnswer', 'Score', 'Notes'
];

function getSheetName(section) {
  if (!section) return 'Writing';
  if (section === 'Help') return 'Help';
  if (section.startsWith('WRITING')) return 'Writing';
  if (section.startsWith('LISTENING')) return 'Listening';
  if (section.startsWith('READING')) return 'ReadingGrammar';
  if (section.startsWith('SPEAKING')) return 'Speaking';
  if (section === 'consultation') return 'Help';
  return 'Writing';
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheetName = getSheetName(data.section || data.type);
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      const header = sheet.getRange(1, 1, 1, COLUMNS.length);
      header.setValues([COLUMNS]);
      header.setFontWeight('bold');
    }

    // Upload userVoice audio if present (base64)
    let userVoiceUrl = data.userVoice || '';
    if (data.userVoiceData && data.userVoiceName) {
      try {
        const folder = DriveApp.getFolderById(USER_VOICE_FOLDER_ID);
        const decoded = Utilities.base64Decode(data.userVoiceData);
        const blob = Utilities.newBlob(decoded, 'audio/webm', data.userVoiceName);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        userVoiceUrl = file.getUrl();
      } catch (e) {
        console.error('Error uploading audio:', e);
      }
    }

    const row = [
      data.time || new Date().toISOString(),
      data.user || '',
      data.email || '',
      data.partNum || '',
      data.file || '',
      data.readingText || '',
      data.question || '',
      data.type || '',
      data.userChoice || '',
      data.userText || '',
      userVoiceUrl,
      data.correctAnswer || '',
      data.score !== undefined && data.score !== '' ? data.score : '',
      data.notes || ''
    ];

    sheet.appendRow(row);

    // Send email notification for consultations
    if (data.type === 'consultation') {
      sendNotificationEmail(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, userVoiceUrl: userVoiceUrl }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendNotificationEmail(data) {
  try {
    const subject = 'Nueva consulta - MET Quiz';
    const body = 'Nueva consulta recibida:\n\n' +
      'Usuario: ' + data.user + '\n' +
      'Email: ' + data.email + '\n' +
      'Mensaje: ' + data.userText + '\n\n' +
      '---\nEnviado desde MET Quiz';
    MailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
  } catch (error) {
    console.error('Error enviando email:', error);
  }
}

function doGet() {
  return ContentService
    .createTextOutput('MET Quiz Apps Script is running correctly.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Clean up audio files older than 30 days
function cleanOldFiles() {
  try {
    const folder = DriveApp.getFolderById(USER_VOICE_FOLDER_ID);
    const files = folder.getFiles();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    let deleted = 0;
    while (files.hasNext()) {
      const file = files.next();
      if (file.getDateCreated() < cutoff) {
        file.setTrashed(true);
        deleted++;
      }
    }
    console.log('CleanOldFiles: ' + deleted + ' files trashed.');
  } catch (error) {
    console.error('Error in cleanOldFiles:', error);
  }
}
