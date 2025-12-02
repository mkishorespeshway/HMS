const nodemailer = require('nodemailer'); 

let transporter;

function getTransport() {
  if (transporter) return transporter;
  const hostRaw = process.env.SMTP_HOST;
  const host = (hostRaw && hostRaw.includes('@')) ? undefined : hostRaw;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();
  const secure = (String(process.env.SMTP_SECURE || '').toLowerCase() === 'true') || (process.env.SMTP_SECURE === '1');
  let service = process.env.SMTP_SERVICE;

  if (!service && user && user.includes('@')) {
    const domain = user.split('@')[1] || '';
    if (domain.includes('gmail')) service = 'gmail';
    else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) service = 'hotmail';
    else if (domain.includes('yahoo')) service = 'yahoo';
  }

  if (!user || !pass) return null;

  if (service) {
    transporter = nodemailer.createTransport({ service, auth: { user, pass } });
  } else if (host && port) {
    transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  } else {
    return null;
  }
  return transporter;
}

exports.sendMail = async function(to, subject, text) {
  const t = getTransport();
  if (!t) return;
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER || to;
  await t.sendMail({ from, to, subject, text });
};
