const searchInput = document.getElementById('game-search');
const filters = [...document.querySelectorAll('.filter')];
const cards = [...document.querySelectorAll('.game-card')];
const emptyState = document.getElementById('empty-state');
const count = document.getElementById('game-count');
const recentSection = document.getElementById('recent-section');
const recentGrid = document.getElementById('recent-grid');
const STORAGE = { favourites: 'blacklight-games:favourites:v1', recent: 'blacklight-games:recent:v1' };

let activeFilter = 'all';
let favourites = readList(STORAGE.favourites);
let recent = readList(STORAGE.recent);

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeList(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be disabled. */ }
}

function gameId(card) {
  return card.dataset.gameId || card.querySelector('h3')?.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';
}

function gameTitle(card) {
  return card.querySelector('h3')?.textContent.trim() || 'Untitled game';
}

function gameHref(card) {
  return card.querySelector('a[href]')?.getAttribute('href') || '#';
}

function decorateCards() {
  cards.forEach(card => {
    const id = gameId(card);
    card.dataset.gameId = id;
    const details = card.querySelector('.game-details');
    if (!details || details.querySelector('.favourite-button')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'favourite-button';
    button.dataset.favourite = id;
    button.setAttribute('aria-label', 'Add ' + gameTitle(card) + ' to favourites');
    button.title = 'Add to favourites';
    button.textContent = '☆';
    details.append(button);
  });
  syncFavouriteButtons();
}

function syncFavouriteButtons() {
  document.querySelectorAll('[data-favourite]').forEach(button => {
    const active = favourites.includes(button.dataset.favourite);
    button.classList.toggle('is-favourite', active);
    button.textContent = active ? '★' : '☆';
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', (active ? 'Remove ' : 'Add ') + 'favourite');
    button.title = active ? 'Remove from favourites' : 'Add to favourites';
  });
}

function renderRecent() {
  if (!recentSection || !recentGrid) return;
  const entries = recent
    .map(id => cards.find(card => gameId(card) === id))
    .filter(card => card && card.querySelector('a[href]'));

  recentGrid.replaceChildren();
  entries.slice(0, 4).forEach(card => {
    const link = document.createElement('a');
    link.className = 'recent-game';
    link.href = gameHref(card);
    const label = document.createElement('span');
    label.className = 'recent-game-type';
    label.textContent = card.querySelector('.game-type')?.textContent.trim() || 'GAME';
    const title = document.createElement('strong');
    title.textContent = gameTitle(card);
    const arrow = document.createElement('span');
    arrow.className = 'recent-arrow';
    arrow.textContent = '↗';
    link.append(label, title, arrow);
    link.addEventListener('click', () => rememberPlayed(gameId(card)));
    recentGrid.append(link);
  });
  recentSection.hidden = entries.length === 0;
}

function rememberPlayed(id) {
  if (!id) return;
  recent = [id, ...recent.filter(item => item !== id)].slice(0, 8);
  writeList(STORAGE.recent, recent);
  renderRecent();
}

function updateLibrary() {
  const query = (searchInput?.value || '').trim().toLowerCase();
  let visible = 0;

  cards.forEach(card => {
    const id = gameId(card);
    const category = card.dataset.category || '';
    const terms = (card.dataset.search || card.innerText).toLowerCase();
    const matchesCategory = activeFilter === 'all'
      || (activeFilter === 'favourites' ? favourites.includes(id) : category === activeFilter);
    const matchesQuery = !query || terms.includes(query);
    const show = matchesCategory && matchesQuery;
    card.hidden = !show;
    if (show) visible++;
  });

  if (emptyState) emptyState.hidden = visible !== 0;
  if (count) count.textContent = visible + ' ' + (visible === 1 ? 'TITLE' : 'TITLES') + ' SHOWN';
}

searchInput?.addEventListener('input', updateLibrary);

filters.forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter || 'all';
  filters.forEach(item => item.classList.toggle('active', item === button));
  updateLibrary();
}));

document.addEventListener('click', event => {
  const favouriteButton = event.target.closest('[data-favourite]');
  if (favouriteButton) {
    event.preventDefault();
    event.stopPropagation();
    const id = favouriteButton.dataset.favourite;
    favourites = favourites.includes(id)
      ? favourites.filter(item => item !== id)
      : [id, ...favourites];
    writeList(STORAGE.favourites, favourites);
    syncFavouriteButtons();
    updateLibrary();
    return;
  }

  const gameLink = event.target.closest('.game-card a[href]');
  if (gameLink) {
    const card = gameLink.closest('.game-card');
    if (card && !card.classList.contains('coming-card')) rememberPlayed(gameId(card));
    else if (card && gameHref(card).startsWith('https://')) rememberPlayed(gameId(card));
  }
});

document.getElementById('year').textContent = new Date().getFullYear();
decorateCards();
renderRecent();
updateLibrary();
