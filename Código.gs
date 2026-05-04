// Configuración
const SHEET_NAME = 'YEW Quiz - Registros';
const NOTIFICATION_EMAIL = 'yourenglishworld.dianagranados@gmail.com';

// Función doPost para recibir datos del quiz
function doPost(e) {
  try {
    // Parsear los datos enviados
    const data = JSON.parse(e.postData.contents);

    // Abrir la hoja de cálculo
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Crear la hoja si no existe
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Configurar encabezados
      sheet.getRange(1, 1, 1, 5).setValues([['Timestamp', 'Nombre', 'Email', 'Categoría', 'Acción', 'Detalle']]);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    }

    // Preparar los datos en orden
    const timestamp = new Date();
    const nombre = data.name || '';
    const email = data.email || '';
    const categoria = data.category || '';
    const accion = data.action || '';
    const detalle = data.detail || '';

    // Agregar fila con los datos
    sheet.appendRow([timestamp, nombre, email, categoria, accion, detalle]);

    // Enviar notificación por email si es consulta
    if (accion === 'CONSULTA') {
      sendNotificationEmail(data);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Función para enviar notificación por email
function sendNotificationEmail(data) {
  try {
    const subject = 'Nueva consulta - MET Quiz';
    const body = 'Nueva consulta recibida:\n\n' +
      'Nombre: ' + data.name + '\n' +
      'Email: ' + data.email + '\n' +
      'Categoría: ' + data.category + '\n' +
      'Acción: ' + data.action + '\n' +
      'Detalle: ' + data.detail + '\n\n' +
      '---\nEnviado desde MET Quiz';

    MailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
  } catch (error) {
    console.error('Error enviando email:', error);
  }
}

// Función doGet para pruebas rápidas
function doGet() {
  return ContentService.createTextOutput('MET Quiz Apps Script is running correctly.')
    .setMimeType(ContentService.MimeType.TEXT);
}
