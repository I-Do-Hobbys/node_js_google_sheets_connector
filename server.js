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


// Async function to read data from a Google Sheet and convert it to JSON
async function readSheet() {
  try {
    // Fetch the values from the specified spreadsheet and range
    const result = await service.spreadsheets.values.get({
      spreadsheetId, // ID of the Google Sheet
      range           // Range of cells to retrieve (e.g., "Sheet1!A1:C10")
    });

    // Extract the 2D array of values
    const values = result.data.values;
    const numRows = values ? values.length : 0; // Count rows, handle undefined

    console.log(`${numRows} rows retrieved.`);

    // If no data was found, return an empty array
    if (!values || values.length === 0) {
      return [];
    }

    // First row is assumed to contain headers (column names)
    const headers = values[0];

    // Remaining rows contain the actual data
    const rows = values.slice(1);

    // Map each row to a JSON object using headers as keys
    const jsonData = rows.map(row => {
      const obj = {}; // Object to store row data

      // Loop over each header and assign corresponding cell value
      headers.forEach((header, i) => {
        const cell = row[i] ?? ""; // Default to empty string if cell is missing

        // Convert numeric strings to actual numbers
        const value = isNumeric(cell) ? Number(cell) : cell;

        obj[header] = value; // Assign to object using header as key
      });

      return obj; // Return the row object
    });

    return jsonData; // Return array of objects

  } catch (error) {
    // Catch any errors (API errors, network issues, etc.) and log them
    console.error("Error reading sheet:", error);
    return null; // Return null if there was an error
  }
}

// Helper function to check if a string represents a numeric value
function isNumeric(value) {
  return typeof value === 'string' && !isNaN(value) && value.trim() !== '';
}