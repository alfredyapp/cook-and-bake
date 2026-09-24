(() => {
  'use strict';

  const STORAGE_KEY = 'cb_signups';
  const COLUMNS = ['ref', 'submitted', 'course_code', 'course_title', 'intake', 'full_name', 'email', 'mobile', 'experience', 'allergies', 'marketing_opt_in', 'paid'];
  const list = document.getElementById('list');
  const status = document.getElementById('status');
  const exportButton = document.getElementById('export-csv');
  let records = [];

  function csvCell(value, column) {
    let text = String(value ?? '');
    if (column !== 'mobile' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  }

  function showRecords() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(stored)) throw new Error('Invalid saved data');
      records = stored;
    } catch {
      status.textContent = 'Saved sign-ups could not be read in this browser.';
      return;
    }
    if (!records.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No sign-ups are saved in this browser.';
      list.append(empty);
      return;
    }
    status.textContent = `${records.length} ${records.length === 1 ? 'sign-up' : 'sign-ups'} saved here.`;
    exportButton.disabled = false;
    const table = document.createElement('table');
    const head = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const column of COLUMNS) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = column;
      headerRow.append(th);
    }
    head.append(headerRow);
    const body = document.createElement('tbody');
    for (const record of records) {
      const row = document.createElement('tr');
      for (const column of COLUMNS) {
        const cell = document.createElement('td');
        cell.textContent = String(record[column] ?? '');
        row.append(cell);
      }
      body.append(row);
    }
    table.append(head, body);
    list.append(table);
  }

  exportButton.addEventListener('click', () => {
    if (!records.length) return;
    const lines = [COLUMNS.join(','), ...records.map((record) => COLUMNS.map((column) => csvCell(record[column], column)).join(','))];
    const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cook-bake-signups-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  showRecords();
})();
