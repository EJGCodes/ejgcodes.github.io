// Theme toggle (persists via localStorage)
(function () {
  const root = document.documentElement;
  const saved = localStorage.getItem('vscode-portfolio-theme') || 'dark';
  root.setAttribute('data-theme', saved);

  // ---- Set this to your GitHub handle to enable live commits ----
  // Leave as "" to keep the static placeholder list in index.html.
  const GITHUB_USERNAME = "";
  const COMMIT_COUNT = 5;
  const CACHE_MS = 10 * 60 * 1000; // 10 minutes

  function setupToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const updateLabel = () => {
      btn.textContent = root.getAttribute('data-theme') === 'dark' ? '☀' : '☾';
    };
    updateLabel();
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('vscode-portfolio-theme', next);
      updateLabel();
    });
  }

  // Reveal-on-scroll animations
  function setupReveal() {
    const els = document.querySelectorAll('.section');
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((e) => io.observe(e));
  }

  // Live clock in status bar
  function setupClock() {
    const el = document.getElementById('clock');
    if (!el) return;
    const tick = () => {
      const d = new Date();
      el.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    tick();
    setInterval(tick, 30000);
  }

  // ---- GitHub recent commits (see files/github-integration.md) ----
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  async function fetchCommits(user) {
    const cacheKey = `gh-commits:${user}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_MS) return data;
      }
    } catch (_) { /* ignore */ }

    const res = await fetch(`https://api.github.com/users/${user}/events/public`);
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const events = await res.json();

    const commits = [];
    for (const ev of events) {
      if (ev.type !== 'PushEvent' || !ev.payload || !ev.payload.commits) continue;
      for (const c of ev.payload.commits) {
        commits.push({
          message: c.message.split('\n')[0],
          repo: ev.repo.name,
          date: ev.created_at,
          url: `https://github.com/${ev.repo.name}/commit/${c.sha}`,
        });
        if (commits.length >= COMMIT_COUNT) break;
      }
      if (commits.length >= COMMIT_COUNT) break;
    }

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: commits }));
    } catch (_) { /* ignore */ }
    return commits;
  }

  async function setupGithubCommits() {
    const list = document.getElementById('gh-commits');
    if (!list || !GITHUB_USERNAME) return;
    try {
      const commits = await fetchCommits(GITHUB_USERNAME);
      if (!commits.length) {
        list.innerHTML = `<li><h5>No recent public commits</h5><div class="meta">github.com/${escapeHtml(GITHUB_USERNAME)}</div></li>`;
        return;
      }
      list.innerHTML = commits.map((c) => `
        <li>
          <h5><a href="${c.url}" target="_blank" rel="noopener">${escapeHtml(c.message)}</a></h5>
          <div class="meta">${escapeHtml(c.repo)} · ${new Date(c.date).toLocaleDateString()}</div>
        </li>
      `).join('');
    } catch (err) {
      list.innerHTML = `<li><h5>Could not load commits</h5><div class="meta">${escapeHtml(err.message)}</div></li>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupToggle();
    setupReveal();
    setupClock();
    setupGithubCommits();
  });
})();
