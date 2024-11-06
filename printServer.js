//npm install express body-parser
//npm install cors

const net = require('net');
const express = require('express');
const cors = require('cors'); // Import the CORS package
const app = express();
const bodyParser = require('body-parser');
const port = 3001;

// Get current date and time
const currentDate = new Date();
const formattedDate = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;

const line = '='.repeat(45) + "\n";
const dash = '-'.repeat(45) + "\n";

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

app.post('/print', (req, res) => {
    const { ipAddress, printerPort, content, invoiceData } = req.body;
    
    // Convert content to ESC/POS commands
    const commands = new Uint8Array([
        0x1B, 0x40,                        // Initialize printer
        0x1B, 0x45, 0x01,                  // Bold on
        0x1B, 0x61, 0x01,                  // Center alignment
        ...new TextEncoder().encode(invoiceData.company.name + "\n"), // Print company name
        0x1B, 0x45, 0x00,                  // Bold off
        ...new TextEncoder().encode(invoiceData.company.address + "\n"), // Print company address
        ...new TextEncoder().encode(line), // Print line of dashes
        0x1B, 0x45, 0x01,                  // Bold on
        0x1D, 0x21, 0x11,                  // Double height and width
        ...new TextEncoder().encode(invoiceData.invoiceDetails.invoiceName.toUpperCase() + "\n"),
        0x1D, 0x21, 0x00,                  // Reset to normal size
        0x1B, 0x45, 0x00,                  // Bold off
        ...new TextEncoder().encode("Invoice #:" + invoiceData.invoiceDetails.invoiceNumber + "\n"),
        0x1B, 0x61, 0x00,                  // Left alignment for the rest of the content
        ...new TextEncoder().encode("\tDate: " + formattedDate + "\n"),
        ...new TextEncoder().encode("\tTransaction By: " + invoiceData.invoiceDetails.transactionBy + "\n\n"),
        0x1B, 0x61, 0x01,                  // Center alignment
        ...new TextEncoder().encode(line), // Print line of dashes
        0x1B, 0x61, 0x00,                  // Left alignment for the rest of the content
        ...new TextEncoder().encode("\tQty    Description\tAmt (RM)\n"),
        0x1B, 0x61, 0x01,                  // Center alignment
        ...new TextEncoder().encode(dash), // Print line of dashes
        0x1B, 0x61, 0x00,                  // Left alignment for the rest of the content
        ...new TextEncoder().encode(content + "\n"), // Invoice content
        0x1B, 0x61, 0x01,                  // Center alignment
        ...new TextEncoder().encode(line), // Print line of dashes
        ...new TextEncoder().encode("Thank you and see you again!\n"),
        ...new TextEncoder().encode("FB: anran.malaysia\n"),
        ...new TextEncoder().encode(line), // Print line of dashes
        0x0A,0x0A,0x0A,0x0A,0x0A,          // Additional line feeds (adjust as necessary)
        0x1D, 0x56, 0x00,                  // Full cut
        0x1B, 0x42, 0x03, 0x01             // Beep 3 times with 1/10 second duration
    ]);

    // Connect to the printer via TCP/IP
    const client = new net.Socket();
    client.connect(printerPort, ipAddress, () => {
        client.write(Buffer.from(commands));
        client.end();
    });

    client.on('error', (error) => {
        console.error('Printing error:', error);
        res.status(500).send('Error printing to network printer');
    });

    client.on('close', () => {
        res.send('Printed successfully');
    });
});

app.listen(port, () => {
    console.log(`Print server running on http://localhost:${port}`);
});
