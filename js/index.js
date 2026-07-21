// Fecha del evento: 22 de Setiembre de 2026 a las 8:00 AM en Costa Rica
const EVENT_DATE = new Date('2026-09-22T08:00:00-06:00').getTime();

function updateCountdown() {
  const now = new Date().getTime();
  const timeDifference = EVENT_DATE - now;

  // Elementos HTML
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');

  // Si la fecha ya llegó o pasó
  if (timeDifference <= 0) {
    if (daysEl) daysEl.textContent = '00';
    if (hoursEl) hoursEl.textContent = '00';
    if (minutesEl) minutesEl.textContent = '00';
    return;
  }

  // Cálculos matemáticos de tiempo
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

  // Formato de dos dígitos (ej: 09 en lugar de 9)
  if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
  if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
  if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
}

// Ejecutar inmediatamente y luego actualizar cada segundo (1000 ms)
updateCountdown();
setInterval(updateCountdown, 1000);