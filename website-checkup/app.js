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
  const payBtn = document.getElementById('pay-btn');
  const priceHint = document.getElementById('price-hint');
  const priceText = document.getElementById('price-text');

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
      showTeaser(data.teaser, data.price);
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

  function showTeaser(teaser, price) {
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

    if (price) {
      priceHint.textContent = price.label;
      priceText.textContent = price.label;
    }

    resultBlock.classList.add('active');
    resultBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
