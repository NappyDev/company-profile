// Seluruh konten dashboard dibaca dari content.json, termasuk saat di GitHub Pages.
(async () => {
  const root = new URL('../', document.currentScript.src);
  const media = value => new URL(value, root).href;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeURL = value => { try { const url = new URL(value, root); return ['http:', 'https:'].includes(url.protocol) ? url.href : '#'; } catch { return '#'; } };
  const image = item => `<img src="${esc(media(item.src))}" alt="${esc(item.title)}" loading="lazy" draggable="false">`;
  try {
    const response = await fetch(new URL('content.json', root), { cache: 'no-cache' });
    if (!response.ok) throw new Error('Konten website tidak dapat dimuat.');
    const data = await response.json();
    const video = document.querySelector('.hero-video-bg');
    if (video && video.querySelector('source').getAttribute('src') !== data.heroVideo) { video.src = media(data.heroVideo); video.load(); video.play().catch(() => {}); }
    const photo = (selector, value) => { const el = document.querySelector(selector); if (el) el.src = media(value); };
    photo('.about-hero-bg img', data.aboutPhoto); photo('.about-logo img', data.aboutLogo); photo('.community-photo img', data.communityPhoto);
    const tube = document.getElementById('tube');
    if (tube) tube.innerHTML = data.carousel.length ? Array.from({ length: 16 }, (_, i) => {
      const item = data.carousel[i % data.carousel.length];
      return `<div class="tube-card" style="--i:${i}">${image(item)}<div class="tube-card-overlay"><h3 class="tube-card-title">${esc(item.title)}</h3><p class="tube-card-desc">${esc(item.desc)}</p></div></div>`;
    }).join('') : '';
    const featured = document.querySelector('.guide-grid');
    if (featured) featured.innerHTML = data.featured.map(item => `<a class="guide-card" href="${esc(safeURL(item.url))}" target="_blank" rel="noopener noreferrer" aria-label="${esc(item.title)} (tab baru)">${image(item)}<div class="guide-card-overlay"><h3 class="guide-card-title">${esc(item.title)}</h3></div></a>`).join('');
    const games = document.getElementById('gamesGrid');
    if (games) {
      games.innerHTML = data.games.map(item => `<a class="game-card" data-tag="${esc(item.category)}" href="${esc(safeURL(item.url))}" target="_blank" rel="noopener noreferrer"><div class="game-thumb">${image(item)}<div class="game-price">${esc(item.price)}</div></div><div class="game-info"><h3 class="game-name">${esc(item.title)}</h3><p class="game-author">by <span>${esc(item.author)}</span></p><p class="game-tag">${esc(item.genre)}</p></div></a>`).join('');
      const filter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
      games.querySelectorAll('.game-card').forEach(card => { card.style.display = filter === 'all' || card.dataset.tag === filter ? '' : 'none'; });
    }
    const team = document.querySelector('.team-grid');
    if (team) team.innerHTML = data.team.map(item => `<div class="team-member"><div class="team-photo">${image(item)}</div><h3 class="team-name">${esc(item.title)}</h3><p class="team-bio">${esc(item.desc)}</p></div>`).join('');
    // Link komponen tetap bekerja saat situs ditempatkan dalam subfolder repository.
    for (const id of ['navbar-placeholder', 'footer-placeholder']) {
      const container = document.getElementById(id);
      if (!container) continue;
      const fix = () => container.querySelectorAll('a[href^="/"]').forEach(a => a.setAttribute('href', new URL(a.getAttribute('href').slice(1), root).href));
      new MutationObserver(fix).observe(container, { childList: true, subtree: true }); fix();
    }
  } catch (error) { console.error(error); }
})();
