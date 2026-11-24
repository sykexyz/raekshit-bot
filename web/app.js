document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    statusEl.textContent = `Status: ${data.status.toUpperCase()} (${data.timestamp})`;
    statusEl.className = 'status-online';
  } catch (err) {
    statusEl.textContent = 'Status: OFFLINE';
    statusEl.className = 'status-offline';
  }
});
