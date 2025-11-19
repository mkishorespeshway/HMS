// Simple slot generator: given availability and slotDuration, generate HH:mm slots for a given date
function timeToMinutes(t){ const [hh,mm]=t.split(':').map(Number); return hh*60+mm; }
function minutesToTime(m){ const hh=Math.floor(m/60).toString().padStart(2,'0'); const mm=(m%60).toString().padStart(2,'0'); return `${hh}:${mm}`; }


exports.generateSlots = (availability, slotDuration) => {
// availability: [{ day:0-6, from:'09:00', to:'17:00' }, ...]
const slotsByDay = {};
availability.forEach(a => {
const fromM = timeToMinutes(a.from);
const toM = timeToMinutes(a.to);
const arr = [];
for (let t = fromM; t + slotDuration <= toM; t += slotDuration) arr.push({ start: minutesToTime(t), end: minutesToTime(t+slotDuration) });
slotsByDay[a.day] = arr;
});
return slotsByDay; // map day->slots
};