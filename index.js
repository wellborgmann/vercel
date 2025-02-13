import { Client } from 'whatsapp-web.js';
import * as puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';

// Configurações do Puppeteer
async function getPuppeteerConfig() {
    if (process.env.NODE_ENV === 'development') {
        console.log('Rodando em desenvolvimento...');
        return {
            executablePath: await puppeteer.executablePath(),
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
        };
    }

    if (process.env.NODE_ENV === 'production') {
        console.log('Rodando em produção...');
        return {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        };
    }
}

(async () => {
    const puppeteerOptions = await getPuppeteerConfig();

    const client = new Client({
        puppeteer: puppeteerCore, // Usa puppeteer-core
        puppeteerOptions, // Configurações definidas acima
    });

    client.on('qr', qr => {
        console.log('QR CODE:', qr);
    });

    client.on('ready', () => {
        console.log('WhatsApp Web está pronto!');
    });

    await client.initialize();
})();
