(function () {
  const GITHUB_USERNAME = "EJGCodes";
  const GITHUB_REPO = "";
  const COMMIT_COUNT = 5;
  const RECENT_REPO_COUNT = 6;
  const CACHE_VERSION = 'v2-commits-api-first';
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

  async function fetchRepoCommits(user, repo, limit) {
    const res = await fetch(`https://api.github.com/repos/${user}/${repo}/commits?per_page=${limit}`);
    console.log('[gh] commits status:', res.status, 'repo:', repo);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((c) => ({
      message: (c.commit.message || '').split('\n')[0],
      repo: `${user}/${repo}`,
      date: c.commit.author?.date || c.commit.committer?.date,
      url: c.html_url,
    }));
  }

  async function fetchCommitsFromEvents(user) {
    const res = await fetch(`https://api.github.com/users/${user}/events/public`);
    console.log('[gh] events status:', res.status);
    if (!res.ok) return [];
    const events = await res.json();
    console.log('[gh] events count:', events.length);
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
    return commits;
  }

  async function fetchCommits(user) {
    const cacheKey = `gh-commits:${CACHE_VERSION}:${user}:${GITHUB_REPO || 'recent'}:${COMMIT_COUNT}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_MS) return data;
      }
    } catch (_) { /* ignore */ }

    // 1) Read actual repo commits first. This includes commits made in GitHub's web UI.
    let commits = [];
    try {
      if (GITHUB_REPO) {
        commits = await fetchRepoCommits(user, GITHUB_REPO, COMMIT_COUNT);
      } else {
        const r = await fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=${RECENT_REPO_COUNT}`);
        console.log('[gh] repos status:', r.status);
        if (r.ok) {
          const repos = await r.json();
          const results = await Promise.all(
            repos.map((repo) => fetchRepoCommits(user, repo.name, 1).catch(() => []))
          );
          commits = results.flat()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, COMMIT_COUNT);
        }
      }
    } catch (e) { console.warn('[gh] commits API failed:', e); }

    // 2) Fallback: public events feed (push events from ~last 90 days)
    if (!commits.length) {
      try {
        commits = await fetchCommitsFromEvents(user);
      } catch (e) { console.warn('[gh] events failed:', e); }
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

  // ---- GitHub recent projects ----
  async function fetchRecentRepos(user, limit) {
    const cacheKey = `gh-projects:${CACHE_VERSION}:${user}:${limit}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_MS) return data;
      }
    } catch (_) { /* ignore */ }

    const res = await fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=${limit * 2}`);
    console.log('[gh] projects status:', res.status);
    if (!res.ok) return [];
    const repos = await res.json();
    const data = repos
      .filter((r) => !r.fork)
      .slice(0, limit)
      .map((r) => ({
        name: r.name,
        description: r.description || '',
        date: r.pushed_at,
        url: r.html_url,
        language: r.language,
        stars: r.stargazers_count,
      }));

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
    } catch (_) { /* ignore */ }
    return data;
  }

  async function setupGithubProjects() {
    const list = document.getElementById('gh-projects');
    if (!list || !GITHUB_USERNAME) return;
    try {
      const repos = await fetchRecentRepos(GITHUB_USERNAME, RECENT_REPO_COUNT);
      if (!repos.length) {
        list.innerHTML = `<li><h5>No public projects</h5><div class="meta">github.com/${escapeHtml(GITHUB_USERNAME)}</div></li>`;
        return;
      }
      list.innerHTML = repos.map((r) => `
        <li>
          <h5><a href="${r.url}" target="_blank" rel="noopener">${escapeHtml(r.name)}</a></h5>
          <div class="meta">
            ${r.language ? escapeHtml(r.language) + ' · ' : ''}updated ${new Date(r.date).toLocaleDateString()}
          </div>
          ${r.description ? `<p>${escapeHtml(r.description)}</p>` : ''}
        </li>
      `).join('');
    } catch (err) {
      list.innerHTML = `<li><h5>Could not load projects</h5><div class="meta">${escapeHtml(err.message)}</div></li>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupToggle();
    setupReveal();
    setupClock();
    setupGithubCommits();
    setupGithubProjects();
  });
})();
