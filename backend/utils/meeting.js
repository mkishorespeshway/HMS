const crypto = require('crypto');
const { google } = require('googleapis');

function toDateTime(date, time, tz) {
  const [hh, mm] = String(time || '00:00').split(':').map((x) => Number(x));
  const d = new Date(date);
  d.setHours(hh, mm, 0, 0);
  return { dateTime: d.toISOString(), timeZone: tz };
}

async function createGoogleMeetLink({ doctorId, date, startTime, endTime }) {
  const tz = process.env.GOOGLE_TZ || 'Asia/Kolkata';
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  const cid = process.env.GOOGLE_CLIENT_ID || '';
  const csec = process.env.GOOGLE_CLIENT_SECRET || '';
  const refresh = process.env.GOOGLE_REFRESH_TOKEN || '';
  const svcEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const svcKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const impersonate = process.env.GOOGLE_CALENDAR_IMPERSONATE || '';

  let auth = null;
  if (cid && csec && refresh) {
    const oauth2 = new google.auth.OAuth2(cid, csec);
    oauth2.setCredentials({ refresh_token: refresh });
    auth = oauth2;
  } else if (svcEmail && svcKey) {
    const scopes = ['https://www.googleapis.com/auth/calendar'];
    if (!impersonate) throw new Error('GOOGLE_CALENDAR_IMPERSONATE is required for service account');
    if (/gmail\.com$/i.test(String(impersonate))) {
      throw new Error('Service account impersonation requires Google Workspace user, not @gmail.com. Use OAuth2 for personal Gmail.');
    }
    auth = new google.auth.JWT(svcEmail, undefined, svcKey, scopes, impersonate || undefined);
  }
  if (!auth) {
    throw new Error('Google credentials not configured. Set OAuth2 (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) or Service Account (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, GOOGLE_CALENDAR_IMPERSONATE).');
  }

  const calendar = google.calendar({ version: 'v3', auth });
  const start = toDateTime(date, startTime, tz);
  const end = toDateTime(date, endTime || startTime, tz);
  const requestId = String(Date.now()) + crypto.randomBytes(4).toString('hex');
  const res = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    requestBody: {
      summary: 'HospoZen Consultation',
      start,
      end,
      attendees: [],
      conferenceData: { createRequest: { requestId } }
    }
  });
  const ev = res && res.data ? res.data : {};
  const cd = ev.conferenceData || {};
  const ep = Array.isArray(cd.entryPoints) ? cd.entryPoints.find((x) => x.uri) : null;
  const url = (ep && ep.uri) || ev.hangoutLink || '';
  const out = String(url || '').trim();
  return out;
}

async function createMeetLink({ doctorId, date, startTime, endTime }) {
  const provider = String(process.env.MEET_PROVIDER || 'google').toLowerCase();
  if (provider === 'google') {
    try {
      const g = await createGoogleMeetLink({ doctorId, date, startTime, endTime });
      if (g) return g;
    } catch (_) {}
  }
  const base = 'https://meet.jit.si';
  const safe = `${String(doctorId)}-${String(date)}-${String(startTime)}`.replace(/[^a-zA-Z0-9_-]/g, '');
  const rand = crypto.randomBytes(4).toString('hex');
  return `${base}/HospoZen-${safe}-${rand}`;
}

module.exports = { createMeetLink };

