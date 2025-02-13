import makeWASocket, { useMultiFileAuthState } from '@adiwajshing/baileys';
import fs from 'fs';

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info/auth_info.json');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            console.log('Conexão fechada, tentando reconectar...');
            connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('Conectado ao WhatsApp!');
        }
    });
}

connectToWhatsApp();
