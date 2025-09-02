require('dotenv').config();

const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 5000;

const {google} = require('googleapis');

const spreadsheetId = process.env.SPREADSHEET_ID;
const range = 'main_items';

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
// Fix the private key newlines
credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const service = google.sheets({ version: "v4", auth });

// Allow requests from any origin (you can restrict this in production)
app.use(cors());

// API endpoint: returns parsed JSON
app.get('/api/sheet_data', async (req, res) => {
  try {
    // const rawData = fs.readFileSync('./Items_with_cost_no_options.json', 'utf8');
    // const jsonData = JSON.parse(rawData);

    const jsonData = await readSheet();

    res.json(jsonData);
  } catch (error) {
    console.error('Error reading JSON:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});


async function readSheet() {
  try {
    const result = await service.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    const values = result.data.values;
    const numRows = values ? values.length : 0;
    console.log(`${numRows} rows retrieved.`);

    if (!values || values.length === 0) {
      return [];
    }

    const headers = values[0];
    const rows = values.slice(1);

    const jsonData = rows.map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        const cell = row[i] ?? "";

        // Check if cell is numeric (int or float)
        const value = isNumeric(cell) ? Number(cell) : cell;
        obj[header] = value;
      });
      return obj;
    });

    return jsonData;
  } catch (error) {
    console.error("Error reading sheet:", error);
    return null;
  }
}

// Helper function to check for numeric strings
function isNumeric(value) {
  return typeof value === 'string' && !isNaN(value) && value.trim() !== '';
}