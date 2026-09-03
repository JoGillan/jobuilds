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
  const junkNote = document.getElementById('junk-note');
  const platformNote = document.getElementById('platform-note');
  const waybackBlock = document.getElementById('wayback-block');
  const waybackHeading = document.getElementById('wayback-heading');
  const waybackLabelOld = document.getElementById('wayback-label-old');
  const waybackImgOld = document.getElementById('wayback-img-old');
  const waybackImgNew = document.getElementById('wayback-img-new');
  const monitorUpsell = document.getElementById('monitor-upsell');
  const monitorBtn = document.getElementById('monitor-btn');
  const monitorPrice = document.getElementById('monitor-price');
  const monitorError = document.getElementById('monitor-error');

  let currentReportId = null;

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

      renderReport(data.report, data.emailedTo, data.priceMonthly, data.alreadyMonitoring);
    } catch (err) {
      showError(err.message);
    }
  }

  function renderReport(report, emailedTo, priceMonthly, alreadyMonitoring) {
    currentReportId = report.reportId;
    reportUrl.textContent = report.url;
    reportRoast.textContent = report.roast;
    reportScore.textContent = report.overall.score;
    reportScore.className = `score-number ${report.overall.status}`;

    if (report.platformName) {
      platformNote.textContent = `Detected platform: ${report.platformName} — fixes below are tailored for it.`;
      platformNote.style.display = 'block';
    } else {
      platformNote.style.display = 'none';
    }

    if (report.wayback) {
      const { yearsAgo, year, screenshotOld, screenshotNew } = report.wayback;
      waybackHeading.textContent = `Still looks like ${year}?`;
      waybackLabelOld.textContent = `${yearsAgo} year${yearsAgo === 1 ? '' : 's'} ago`;
      waybackImgOld.src = screenshotOld;
      waybackImgNew.src = screenshotNew;
      waybackBlock.style.display = 'block';
    } else {
      waybackBlock.style.display = 'none';
    }

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
      junkNote.style.display = 'block';
    }

    if (priceMonthly) {
      monitorPrice.textContent = priceMonthly.label;
    }

    if (alreadyMonitoring) {
      monitorUpsell.innerHTML = `<h3>You're all set</h3><p>We'll re-check this site every month and email you if anything changes.</p>`;
    } else {
      monitorBtn.addEventListener('click', startMonitoring);
    }

    loadingState.style.display = 'none';
    reportState.style.display = 'block';
  }

  async function startMonitoring() {
    if (!currentReportId) return;
    monitorError.style.display = 'none';
    monitorBtn.disabled = true;
    monitorBtn.textContent = 'Redirecting to checkout…';

    try {
      const res = await fetch(`${API_BASE}/create-subscription-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: currentReportId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start checkout.');
      window.location.href = data.url;
    } catch (err) {
      monitorBtn.disabled = false;
      monitorBtn.textContent = 'Start monthly monitoring';
      monitorError.textContent = err.message;
      monitorError.style.display = 'block';
    }
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
