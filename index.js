import { WAConnection } from '@adiwajshing/baileys';
import fs from 'fs';

const conn = new WAConnection();

conn.on('open', () => {
    console.log('Credentials updated!');
    const authInfo = conn.base64EncodedAuthInfo();
    fs.writeFileSync('./auth_info.json', JSON.stringify(authInfo, null, '\t'));
});

conn.connect();
