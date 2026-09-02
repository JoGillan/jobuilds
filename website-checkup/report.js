(function () {
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const errorDetail = document.getElementById('error-detail');
  const reportState = document.getElementById('report-state');

  const reportUrl = document.getElementById('report-url');
  const reportRoast = document.getElementById('report-roast');
  const reportScore = document.getElementById('report-score');
  const categoriesContainer = document.getElementById('categories-container');
  const prioritiesContainer = document.getElementById('priorities-container');
  const emailNote = document.getElementById('email-note');

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

  if (!sessionId) {
    showError("No payment session was found. If you've just paid, check your email — we sent the report there too.");
  } else {
    verify(sessionId);
  }

  async function verify(sessionId) {
    try {
      const res = await fetch(`${API_BASE}/verify?session_id=${encodeURIComponent(sessionId)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not verify your payment.');
      }

      renderReport(data.report, data.emailedTo);
    } catch (err) {
      showError(err.message);
    }
  }

  function renderReport(report, emailedTo) {
    reportUrl.textContent = report.url;
    reportRoast.textContent = report.roast;
    reportScore.textContent = report.overall.score;
    reportScore.className = `score-number ${report.overall.status}`;

    prioritiesContainer.innerHTML = '';
    if (report.topPriorities && report.topPriorities.length > 0) {
      const box = document.createElement('div');
      box.className = 'priority-box';

      const heading = document.createElement('h3');
      heading.textContent = 'Fix these first';
      box.appendChild(heading);

      const list = document.createElement('ol');
      list.className = 'priority-list';
      report.topPriorities.forEach((p) => {
        const li = document.createElement('li');
        li.innerHTML = `<div class="priority-label">${escapeHtml(p.label)}</div><div class="priority-fix">${escapeHtml(p.fix)}</div>`;
        list.appendChild(li);
      });
      box.appendChild(list);
      prioritiesContainer.appendChild(box);
    }

    categoriesContainer.innerHTML = '';
    Object.values(report.categories).forEach((cat) => {
      const section = document.createElement('div');
      section.className = 'full-category';

      const heading = document.createElement('h3');
      heading.innerHTML = `<span class="dot ${cat.status}"></span>${escapeHtml(cat.name)}`;
      section.appendChild(heading);

      cat.checks.forEach((check) => {
        const row = document.createElement('div');
        row.className = 'check-row';
        const fixLine = check.fix
          ? `<div class="check-fix">→ ${escapeHtml(check.fix)}</div>`
          : '';
        row.innerHTML = `
          <span class="dot ${check.status}"></span>
          <div>
            <div class="check-label">${escapeHtml(check.label)}</div>
            <div class="check-detail">${escapeHtml(check.detail)}</div>
            ${fixLine}
          </div>`;
        section.appendChild(row);
      });

      categoriesContainer.appendChild(section);
    });

    if (emailedTo) {
      emailNote.textContent = `We've also sent this report to ${emailedTo}.`;
    }

    loadingState.style.display = 'none';
    reportState.style.display = 'block';
  }

  function showError(message) {
    errorDetail.textContent = message;
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
