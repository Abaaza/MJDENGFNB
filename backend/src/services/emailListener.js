import Imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import { processEmail } from './inquiryService.js';

const CHECK_INTERVAL = 60 * 1000; // 1 minute

function getConfig() {
  return {
    imap: {
      user: process.env.INBOX_USER,
      password: process.env.INBOX_PASS,
      host: process.env.INBOX_HOST || 'imap-mail.outlook.com',
      port: Number(process.env.INBOX_PORT) || 993,
      tls: true,
      authTimeout: 10000,
      tlsOptions: { rejectUnauthorized: false }, // helpful for Outlook SSL quirk
    },
  };
}

async function handleMessages(connection) {
  try {
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: [''], struct: true };
    const results = await connection.search(searchCriteria, fetchOptions);

    for (const res of results) {
      const all = res.parts.find(p => p.which === '');
      const raw = all?.body || '';
      const parsed = await simpleParser(raw);
      const attachments = [];

      for (const att of parsed.attachments || []) {
        attachments.push({ filename: att.filename, content: att.content });
      }

      const msg = {
        projectCode: parsed.subject || 'UNKNOWN',
        client: parsed.from?.value?.[0]?.address || '',
        type: 'Email',
        due: new Date().toISOString().slice(0, 10),
        attachments,
      };

      processEmail(msg);
      await connection.addFlags(res.attributes.uid, ['\\Seen']);
    }
  } catch (err) {
    console.error('Error handling messages:', err);
  }
}

export async function startEmailListener() {
  try {
    const connection = await Imap.connect(getConfig());
    await connection.openBox('INBOX');
    console.log('📬 Email listener connected to INBOX');

    // Initial check
    await handleMessages(connection);

    // Polling
    setInterval(() => handleMessages(connection), CHECK_INTERVAL);
  } catch (err) {
    console.error('Email listener failed to start:', err);
  }
}
