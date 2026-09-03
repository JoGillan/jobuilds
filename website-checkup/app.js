(function () {
  const form = document.getElementById('audit-form');
  const urlInput = document.getElementById('url-input');
  const submitBtn = document.getElementById('submit-btn');
  const errorMsg = document.getElementById('error-msg');

  const loadingBlock = document.getElementById('loading-block');
  const loadingSteps = document.querySelectorAll('#loading-steps li');

  const resultBlock = document.getElementById('result-block');
  const roastText = document.getElementById('roast-text');
  const scoreNumber = document.getElementById('score-number');
  const categoryGrid = document.getElementById('category-grid');
  const issueCount = document.getElementById('issue-count');
  const platformNote = document.getElementById('platform-note');
  const payBtn = document.getElementById('pay-btn');
  const priceHint = document.getElementById('price-hint');
  const priceText = document.getElementById('price-text');
  const subscribeBtn = document.getElementById('subscribe-btn');
  const priceMonthlyText = document.getElementById('price-monthly-text');

  const compareForm = document.getElementById('compare-form');
  const competitorInput = document.getElementById('competitor-input');
  const compareBtn = document.getElementById('compare-btn');
  const compareError = document.getElementById('compare-error');
  const compareResult = document.getElementById('compare-result');

  let currentReportId = null;

  // If we bounced back here after a cancelled checkout, restore the reportId.
  const params = new URLSearchParams(window.location.search);
  if (params.get('reportId')) {
    currentReportId = params.get('reportId');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = urlInput.value.trim();
    if (!value) return;

    resetUI();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking…';
    loadingBlock.classList.add('active');
    runLoadingAnimation();

    try {
      const res = await fetch(`${API_BASE}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      currentReportId = data.reportId;
      showTeaser(data.teaser, data.price, data.priceMonthly);
    } catch (err) {
      showError(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Check my site';
      loadingBlock.classList.remove('active');
    }
  });

  payBtn.addEventListener('click', async () => {
    if (!currentReportId) return;
    payBtn.disabled = true;
    payBtn.textContent = 'Redirecting to checkout…';

    try {
      const res = await fetch(`${API_BASE}/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: currentReportId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start checkout.');
      window.location.href = data.url;
    } catch (err) {
      payBtn.disabled = false;
      payBtn.textContent = 'Unlock full report';
      showError(err.message);
    }
  });

  subscribeBtn.addEventListener('click', async () => {
    if (!currentReportId) return;
    const originalLabel = subscribeBtn.innerHTML;
    subscribeBtn.disabled = true;
    subscribeBtn.textContent = 'Redirecting to checkout…';

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
      subscribeBtn.disabled = false;
      subscribeBtn.innerHTML = originalLabel;
      showError(err.message);
    }
  });

  compareForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = competitorInput.value.trim();
    if (!value || !currentReportId) return;

    compareError.style.display = 'none';
    compareResult.style.display = 'none';
    compareBtn.disabled = true;
    compareBtn.textContent = 'Comparing…';

    try {
      const res = await fetch(`${API_BASE}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: currentReportId, competitorUrl: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't run that comparison.");
      showCompare(data);
    } catch (err) {
      compareError.textContent = err.message;
      compareError.style.display = 'block';
    } finally {
      compareBtn.disabled = false;
      compareBtn.textContent = 'Compare';
    }
  });

  function runLoadingAnimation() {
    loadingSteps.forEach((li) => li.classList.remove('visible', 'done'));
    let i = 0;
    const interval = setInterval(() => {
      if (i > 0) loadingSteps[i - 1]?.classList.add('done');
      if (i >= loadingSteps.length) {
        clearInterval(interval);
        return;
      }
      loadingSteps[i].classList.add('visible');
      i += 1;
    }, 480);
  }

  function showTeaser(teaser, price, priceMonthly) {
    roastText.textContent = teaser.roast;
    scoreNumber.textContent = teaser.overallScore;
    scoreNumber.className = `score-number ${teaser.overallStatus}`;

    categoryGrid.innerHTML = '';
    teaser.categories.forEach((cat) => {
      const chip = document.createElement('div');
      chip.className = 'category-chip';
      chip.innerHTML = `<span class="dot ${cat.status}"></span><span class="cat-name">${escapeHtml(cat.name)}</span>`;
      categoryGrid.appendChild(chip);
    });

    issueCount.innerHTML = `We found <strong>${teaser.issueCount} thing${teaser.issueCount === 1 ? '' : 's'}</strong> worth fixing.`;

    if (teaser.platformName) {
      platformNote.textContent = `Detected platform: ${teaser.platformName} — fixes below are tailored for it.`;
      platformNote.style.display = 'block';
    } else {
      platformNote.style.display = 'none';
    }

    if (price) {
      priceHint.textContent = price.label;
      priceText.textContent = price.label;
    }
    if (priceMonthly) {
      priceMonthlyText.textContent = priceMonthly.label;
    }

    // Reset the compare block for a fresh check.
    competitorInput.value = '';
    compareError.style.display = 'none';
    compareResult.style.display = 'none';
    compareResult.innerHTML = '';

    resultBlock.classList.add('active');
    resultBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showCompare(data) {
    const { yours, theirs, youWin } = data;

    const renderCategories = (categories) =>
      categories
        .map(
          (c) =>
            `<div class="compare-cat"><span class="dot ${c.status}"></span><span class="cat-name">${escapeHtml(c.name)}</span></div>`
        )
        .join('');

    const verdict = youWin
      ? `You're ahead — nice.`
      : `Your competitor is currently ahead of you.`;

    compareResult.innerHTML = `
      <p class="compare-verdict">${verdict}</p>
      <div class="compare-grid">
        <div class="compare-col">
          <div class="compare-col-head">
            <span class="compare-col-label">You</span>
            <span class="compare-score">${yours.overallScore}</span>
          </div>
          ${renderCategories(yours.categories)}
        </div>
        <div class="compare-col">
          <div class="compare-col-head">
            <span class="compare-col-label">${escapeHtml(new URL(theirs.url).hostname)}</span>
            <span class="compare-score">${theirs.overallScore}</span>
          </div>
          ${renderCategories(theirs.categories)}
        </div>
      </div>
    `;
    compareResult.style.display = 'block';
  }

  function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
  }

  function resetUI() {
    errorMsg.style.display = 'none';
    resultBlock.classList.remove('active');
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
