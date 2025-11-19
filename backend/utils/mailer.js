const nodemailer = require('nodemailer');

let transporter;

function getTransport() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: !!process.env.SMTP_SECURE,
    auth: { user, pass }
  });
  return transporter;
}

exports.sendMail = async function(to, subject, text) {
  const t = getTransport();
  if (!t) return;
  const from = process.env.FROM_EMAIL || to;
  await t.sendMail({ from, to, subject, text });
};