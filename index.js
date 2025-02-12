import express, { query } from 'express';
const app = express()
const PORT = 8000

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;


const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "client-2",
        dataPath: "./session",
    }),
    puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        executablePath: '/usr/bin/google-chrome',


    },
});

client.on("qr", (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error("Erro ao gerar QR Code:", err);
            return;
        }
        imgQr = url;
        // Emite a URL do QR Code para o frontend via WebSocket
        
    });
});


app.get('/', (req, res) => {
  res.send(imgQr)
})
app.get('/about', (req, res) => {
  res.send('About route 🎉 ')
})
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
})
