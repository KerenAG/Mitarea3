
const API_URL = 'http://www.raydelto.org/agenda.php';

const grid = document.getElementById('grid');
const emptyState = document.getElementById('emptyState');
const messageEl = document.getElementById('message');
const form = document.getElementById('addContactForm');
const searchInput = document.getElementById('searchList') || document.getElementById('search');
const refreshBtn = document.getElementById('refresh');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

const ROWS = 3;
const COLS = 5;
let pageSize = ROWS * COLS; 
let currentPage = 0;
let contacts = [];

async function loadContacts() {
  if (messageEl) messageEl.textContent = 'Cargando contactos...';
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Respuesta no OK: ' + res.status);
    const data = await res.json();
    contacts = Array.isArray(data) ? data : [];
    renderPage();
    if (messageEl) messageEl.textContent = 'Contactos cargados: ' + contacts.length;
  } catch (err) {
    console.error(err);
    if (messageEl) messageEl.textContent = 'No se pudieron cargar los contactos. ' + err.message;
    contacts = [];
    renderPage();
  }
}

function filteredContacts() {
  const q = (searchInput && searchInput.value || '').toLowerCase().trim();
  if (!q) return contacts;
  return contacts.filter(c => ((c.nombre||'') + ' ' + (c.apellido||'') + ' ' + (c.telefono||'')).toLowerCase().includes(q));
}

function renderPage() {
  const list = filteredContacts();
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  if (currentPage >= totalPages) currentPage = totalPages - 1;
  const start = currentPage * pageSize;
  const pageItems = list.slice(start, start + pageSize);

  grid.innerHTML = '';
  if (pageItems.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    for (let i = 0; i < pageSize; i++) {
      const c = pageItems[i];
      const card = document.createElement('article');
      card.className = 'card';
      if (c) {
        card.innerHTML = `
          <h3>${escapeHtml(c.nombre||'')} ${escapeHtml(c.apellido||'')}</h3>
          <p class="meta">Contacto</p>
          <div class="phone">${escapeHtml(c.telefono||'')}</div>
        `;
      } else {
        card.innerHTML = `<div aria-hidden="true"></div>`; 
        card.style.opacity = '0'; 
      }
      grid.appendChild(card);
    }
  }
  pageInfo.textContent = 'Página ' + (currentPage + 1) + ' de ' + totalPages;
}

async function addContact(payload) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error('Error al agregar: ' + res.status + ' ' + text);
    }
    try { return await res.json(); } catch(e){ return true; }
  } catch (err) { throw err; }
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  if (!nombre || !apellido || !telefono) {
    if (messageEl) messageEl.textContent = 'Por favor complete todos los campos antes de enviar.';
    return;
  }
  if (messageEl) messageEl.textContent = 'Enviando...';
  try {
    await addContact({ nombre, apellido, telefono });
    if (messageEl) messageEl.textContent = 'Contacto agregado. Actualizando lista...';
    form.reset();
    await loadContacts();
    const total = filteredContacts().length;
    currentPage = Math.max(0, Math.ceil(total / pageSize) - 1);
    renderPage();
  } catch (err) {
    console.error(err);
    if (messageEl) messageEl.textContent = 'Error al agregar contacto: ' + err.message;
  }
});

searchInput.addEventListener('input', () => {
  currentPage = 0;
  renderPage();
});

refreshBtn.addEventListener('click', () => loadContacts());

prevBtn.addEventListener('click', () => {
  if (currentPage > 0) {
    currentPage--;
    renderPage();
  }
});
nextBtn.addEventListener('click', () => {
  const total = filteredContacts().length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (currentPage < totalPages - 1) {
    currentPage++;
    renderPage();
  }
});

function escapeHtml(str){ return String(str)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

window.addEventListener('load', () => {
  loadContacts();
});
