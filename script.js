/*
  script.js - Full app wiring:
  - navigation (side + card clicks + back buttons)
  - profile (avatar upload, save/load fields, editable state)
  - checklist (defaults + custom tasks + progress)
  - portfolio (add/delete releases, videos, epks)
  - consultation booking (store booking + show live-call placeholder)
  - loading screen hide
*/

(function () {
  // helper selectors
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

  // --- Elements
  const panels = $$('.panel');
  const navButtons = $$('.nav-item');
  const cards = $$('.card[data-target]');
  const backButtons = $$('.back');
  const sectionTitle = $('#section-title');
  const yearEl = $('#year');
  const layoutToggle = $('#layoutToggle');

  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  // --- Navigation
  function activatePanel(id) {
    panels.forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('active');

    // Set heading: use h2 inside panel if available, otherwise fallback
    sectionTitle.textContent = id === 'menu' ? 'Main Menu' : (panel?.querySelector('h2')?.textContent || panel?.querySelector('h3')?.textContent || 'Section');

    navButtons.forEach(b => b.classList.toggle('active', b.dataset.target === id));

    if (id === 'menu') { updateHomeProgress(); }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    try { localStorage.setItem('jp.last', id); } catch (e) { /* ignore */ }
  }

  navButtons.forEach(btn => btn.addEventListener('click', () => activatePanel(btn.dataset.target)));
  cards.forEach(card => card.addEventListener('click', () => activatePanel(card.dataset.target)));
  backButtons.forEach(btn => btn.addEventListener('click', () => activatePanel('menu')));

  if (layoutToggle) {
    layoutToggle.addEventListener('click', () => document.body.classList.toggle('layout-dashboard'));
  }

  // --- Avatar upload
  const profileUpload = $('#profileUpload');
  const profileImage = $('#profileImage');

  function loadAvatar() {
    try {
      const dataUrl = localStorage.getItem('jp_profile_image');
      if (dataUrl && profileImage) profileImage.src = dataUrl;
    } catch (e) { /* ignore */ }
  }
  loadAvatar();

  if (profileUpload && profileImage) {
    profileUpload.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        const dataUrl = ev.target.result;
        profileImage.src = dataUrl;
        try { localStorage.setItem('jp_profile_image', dataUrl); } catch (err) {
          console.warn('Could not store image in localStorage', err);
          alert('Image is too large to save. Try a smaller one.');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // --- Profile fields
  const profileFields = [
    'stageName','email','website','timezone','genre','bio',
    'spotify','apple','youtube','instagram','tiktok','facebook',
    'followers','streams','releases'
  ];

  function loadProfile() {
    profileFields.forEach(id => {
      const el = document.getElementById(id);
      const val = localStorage.getItem('jp_profile_' + id);
      if (el && val !== null) el.value = val;
    });
    updateProfileDisplay();
  }

  function updateProfileDisplay() {
    // artist name + headline
    const stage = localStorage.getItem('jp_profile_stageName') || document.getElementById('stageName')?.value || '';
    const genre = localStorage.getItem('jp_profile_genre') || document.getElementById('genre')?.value || '';
    const bio = localStorage.getItem('jp_profile_bio') || '';

    const artistNameEl = $('#artistName');
    const profileHeadline = $('#profileHeadline');
    if (artistNameEl) artistNameEl.textContent = stage || 'Jae-P™';
    if (profileHeadline) profileHeadline.textContent = genre ? `${genre}` : 'Artist · Producer · Songwriter';

    // stats
    const followers = localStorage.getItem('jp_profile_followers') || document.getElementById('followers')?.value || '—';
    const streams = localStorage.getItem('jp_profile_streams') || document.getElementById('streams')?.value || '—';
    const releases = localStorage.getItem('jp_profile_releases') || document.getElementById('releases')?.value || '—';

    const pf = $('#profileFollowers'), ps = $('#profileStreams'), pr = $('#profileReleasesCount');
    if (pf) pf.textContent = followers || (followers === '0' ? '0' : '—');
    if (ps) ps.textContent = streams || (streams === '0' ? '0' : '—');
    if (pr) pr.textContent = releases || (releases === '0' ? '0' : '—');

    // socials preview (only show provided links)
    const socialsEl = $('#profileSocialsPreview');
    if (socialsEl) {
      const parts = [];
      const addIf = (id, emoji, label) => {
        const v = localStorage.getItem('jp_profile_' + id) || document.getElementById(id)?.value || '';
        if (v) {
          const href = v.startsWith('http') ? v : (id === 'spotify' ? v : 'https://' + v);
          parts.push(`<a class="link-card" href="${href}" target="_blank">${emoji} ${label}</a>`);
        }
      };
      addIf('spotify', '🎧', 'Spotify');
      addIf('apple', '🍎', 'Apple');
      addIf('youtube', '📺', 'YouTube');
      addIf('instagram', '📷', 'Instagram');
      addIf('tiktok', '🎵', 'TikTok');
      addIf('facebook', '📘', 'Facebook');

      socialsEl.innerHTML = parts.join(' ');
    }
  }

  function setProfileEditable(editing) {
    profileFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = !editing;
    });
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
      editBtn.classList.toggle('editing', editing);
      editBtn.textContent = editing ? 'Cancel edit' : 'Edit profile';
    }
    // visual focus
    if (editing) {
      const first = document.getElementById(profileFields[0]);
      if (first) { first.focus(); first.select?.(); }
    }
  }

  // initial load
  loadProfile();
  setProfileEditable(false);

  // --- Save profile
  const saveProfileBtn = document.getElementById('saveProfile');
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
      profileFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) localStorage.setItem('jp_profile_' + id, el.value || '');
      });
      alert('Profile saved!');
      updateProfileDisplay();
      setProfileEditable(false);
    });
  }

  // cancel edit
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loadProfile();
      setProfileEditable(false);
    });
  }

  // top edit button toggles edit mode and opens profile panel
  const editBtn = document.getElementById('editProfileBtn');
  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const editing = editBtn.classList.contains('editing');
      if (editing) {
        loadProfile();
        setProfileEditable(false);
        return;
      }
      activatePanel('profile');
      setProfileEditable(true);
      const target = document.getElementById('profileEditCard');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // view portfolio
  const viewPortfolioBtn = document.getElementById('viewPortfolioBtn');
  if (viewPortfolioBtn) {
    viewPortfolioBtn.addEventListener('click', (e) => {
      e.preventDefault();
      activatePanel('portfolio');
      renderPortfolio();
      const p = document.getElementById('portfolio');
      if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // --- Checklist (defaults + custom)
  const DEFAULT_TASKS = [
    { key: 'mix', text: 'Mix & Master complete' },
    { key: 'artwork', text: 'Artwork ready' },
    { key: 'metadata', text: 'Final metadata (title, ISRC/UPC if available)' },
    { key: 'social', text: 'Social profiles claimed & updated' },
    { key: 'marketing', text: 'Marketing' },
    { key: 'presskit', text: 'EPK/press kit ready' },
    { key: 'preSave', text: 'Pre-save / pre-order links created' },
  ];

  const checklistList = $('#checklistList');
  const newTaskInput = $('#newTaskInput');
  const addTaskBtn = $('#addTaskBtn');

  function getCustomTasks() {
    try { return JSON.parse(localStorage.getItem('jp_custom_tasks') || '[]'); } catch { return []; }
  }
  function setCustomTasks(arr) { localStorage.setItem('jp_custom_tasks', JSON.stringify(arr)); }

  function getDefaultDone(key) { return localStorage.getItem('jp_check_' + key) === '1'; }
  function setDefaultDone(key, val) { localStorage.setItem('jp_check_' + key, val ? '1' : '0'); }

  function updateProgressUI() {
    const defaultsCompleted = DEFAULT_TASKS.filter(t => getDefaultDone(t.key)).length;
    const defaultsTotal = DEFAULT_TASKS.length;
    const custom = getCustomTasks();
    const customCompleted = custom.filter(t => t.done).length;
    const customTotal = custom.length;

    const total = defaultsTotal + customTotal;
    const done = defaultsCompleted + customCompleted;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const fill = $('#progressFill');
    const cnt = $('#progressCount');
    const tot = $('#progressTotal');
    const fill2 = $('#progressFill2');
    const cnt2 = $('#progressCount2');
    const tot2 = $('#progressTotal2');

    [fill, fill2].forEach(el => { if (el) el.style.width = pct + '%'; });
    [cnt, cnt2].forEach(el => { if (el) el.textContent = String(done); });
    [tot, tot2].forEach(el => { if (el) el.textContent = String(total); });
  }

  function renderChecklist() {
    if (!checklistList) return;
    checklistList.innerHTML = '';

    const fragment = document.createDocumentFragment();

    const addItem = (id, text, checked, isCustom = false) => {
      const row = document.createElement('div');
      row.className = 'item';
      const inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.checked = checked;
      const label = document.createElement('label');
      label.textContent = text;

      const remove = document.createElement('span');
      remove.className = 'remove';
      remove.textContent = isCustom ? 'Remove' : '';
      if (isCustom) {
        remove.addEventListener('click', () => {
          const arr = getCustomTasks().filter(t => t.id !== id);
          setCustomTasks(arr);
          renderChecklist();
        });
      } else {
        remove.style.visibility = 'hidden';
      }

      row.appendChild(inp);
      row.appendChild(label);
      row.appendChild(remove);
      fragment.appendChild(row);

      if (isCustom) {
        inp.addEventListener('change', () => {
          const arr = getCustomTasks().map(t => t.id === id ? ({ ...t, done: inp.checked }) : t);
          setCustomTasks(arr);
          updateProgressUI();
        });
      } else {
        inp.addEventListener('change', () => {
          setDefaultDone(id, inp.checked);
          updateProgressUI();
        });
      }
    };

    DEFAULT_TASKS.forEach(t => addItem(t.key, t.text, getDefaultDone(t.key), false));
    getCustomTasks().forEach(t => addItem(t.id, t.text, !!t.done, true));

    checklistList.appendChild(fragment);
    updateProgressUI();
  }

  if (addTaskBtn && newTaskInput) {
    addTaskBtn.addEventListener('click', () => {
      const txt = (newTaskInput.value || '').trim();
      if (!txt) return;
      const id = 'c_' + Date.now();
      const arr = getCustomTasks();
      arr.push({ id, text: txt, done: false });
      setCustomTasks(arr);
      newTaskInput.value = '';
      renderChecklist();
    });
    newTaskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addTaskBtn.click(); }
    });
  }

  function updateHomeProgress() { updateProgressUI(); }

  // --- Portfolio (releases, videos, epks)
  const PORT_KEYS = {
    releases: 'jp_portfolio_releases',
    videos: 'jp_portfolio_videos',
    epks: 'jp_portfolio_epks'
  };

  function getItems(type) {
    try { return JSON.parse(localStorage.getItem(PORT_KEYS[type]) || '[]'); } catch { return []; }
  }
  function setItems(type, arr) { localStorage.setItem(PORT_KEYS[type], JSON.stringify(arr)); }

  function renderPortfolio() {
    renderList('releaseList', 'releases');
    renderList('videoList', 'videos');
    renderList('epkList', 'epks');
  }

  function renderList(containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const items = getItems(type);
    container.innerHTML = '';
    if (items.length === 0) {
      container.innerHTML = `<div class="empty muted">No items added yet.</div>`;
      return;
    }
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'portfolio-item';
      const title = document.createElement('div');
      title.className = 'pi-title';
      title.textContent = item.title || (item.link || 'Untitled');

      const actions = document.createElement('div');
      actions.className = 'pi-actions';

      if (item.link) {
        const link = document.createElement('a');
        link.href = item.link;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Open';
        link.className = 'btn';
        actions.appendChild(link);
      }

      const del = document.createElement('button');
      del.className = 'btn';
      del.textContent = 'Delete';
      del.addEventListener('click', () => {
        const arr = getItems(type).filter(i => i.id !== item.id);
        setItems(type, arr);
        renderList(containerId, type);
      });
      actions.appendChild(del);

      row.appendChild(title);
      row.appendChild(actions);
      container.appendChild(row);
    });
  }

  const addReleaseBtn = $('#addReleaseBtn');
  const addVideoBtn = $('#addVideoBtn');
  const addEpkBtn = $('#addEpkBtn');

  if (addReleaseBtn) {
    addReleaseBtn.addEventListener('click', () => {
      const title = (document.getElementById('releaseTitle').value || '').trim();
      const link = (document.getElementById('releaseLink').value || '').trim();
      if (!title && !link) { alert('Add a release title or link.'); return; }
      const arr = getItems('releases');
      arr.push({ id: Date.now(), title, link });
      setItems('releases', arr);
      document.getElementById('releaseTitle').value = '';
      document.getElementById('releaseLink').value = '';
      renderList('releaseList', 'releases');
    });
  }
  if (addVideoBtn) {
    addVideoBtn.addEventListener('click', () => {
      const title = (document.getElementById('videoTitle').value || '').trim();
      const link = (document.getElementById('videoLink').value || '').trim();
      if (!link) { alert('Please add a video link (YouTube/Vimeo).'); return; }
      const arr = getItems('videos');
      arr.push({ id: Date.now(), title, link });
      setItems('videos', arr);
      document.getElementById('videoTitle').value = '';
      document.getElementById('videoLink').value = '';
      renderList('videoList', 'videos');
    });
  }
  if (addEpkBtn) {
    addEpkBtn.addEventListener('click', () => {
      const title = (document.getElementById('epkTitle').value || '').trim();
      const link = (document.getElementById('epkLink').value || '').trim();
      if (!link) { alert('Please add an EPK link (URL to PDF or page).'); return; }
      const arr = getItems('epks');
      arr.push({ id: Date.now(), title, link });
      setItems('epks', arr);
      document.getElementById('epkTitle').value = '';
      document.getElementById('epkLink').value = '';
      renderList('epkList', 'epks');
    });
  }

  // --- Consult booking
  const consultForm = $('#consultForm');
  const liveCallWindow = $('#liveCallWindow');
  const endCallBtn = $('#endCallBtn');

  if (consultForm) {
    consultForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(consultForm));
      // store bookings locally (demo)
      try {
        const bookings = JSON.parse(localStorage.getItem('jp_bookings') || '[]');
        bookings.push({ id: Date.now(), ...data });
        localStorage.setItem('jp_bookings', JSON.stringify(bookings));
      } catch (err) { console.warn('Could not save booking', err); }

      alert(`Thanks ${data.name}! Booking requested for ${data.datetime} via ${data.platform} at $${data.rate}/hr.`);

      // show live-call placeholder (demo)
      if (consultForm) consultForm.classList.add('hidden');
      if (liveCallWindow) liveCallWindow.classList.remove('hidden');
    });
  }

  window.closeLiveCall = function closeLiveCall() {
    if (liveCallWindow) liveCallWindow.classList.add('hidden');
    if (consultForm) consultForm.classList.remove('hidden');
  };

  if (endCallBtn) {
    endCallBtn.addEventListener('click', () => {
      alert('Call ended (demo).');
      closeLiveCall();
    });
  }

  // --- startup render & load
  const start = localStorage.getItem('jp.last') || 'menu';
  activatePanel(start);
  renderChecklist();
  renderPortfolio();
  updateHomeProgress();

  // --- DOMContentLoaded extras
  document.addEventListener("DOMContentLoaded", () => {
    // fallback nav (ensure all links wired)
    const navButtons = document.querySelectorAll("[data-target]");
    navButtons.forEach(button => {
      button.addEventListener("click", () => {
        const target = button.getAttribute("data-target");
        panels.forEach(panel => panel.classList.remove("active"));
        const targetPanel = document.getElementById(target);
        if (targetPanel) {
          targetPanel.classList.add("active");
          sectionTitle.textContent = targetPanel.querySelector("h2")
            ? targetPanel.querySelector("h2").textContent
            : "Main Menu";
        }
        navButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
      });
    });

    // back buttons behavior (ensure they return to menu)
    const backButtons = document.querySelectorAll(".back");
    backButtons.forEach(backBtn => {
      backBtn.addEventListener("click", () => {
        panels.forEach(panel => panel.classList.remove("active"));
        const menu = document.getElementById("menu");
        if (menu) menu.classList.add("active");
        sectionTitle.textContent = "Main Menu";
        navButtons.forEach(btn => btn.classList.remove("active"));
        const menuBtn = document.querySelector('[data-target="menu"]');
        if (menuBtn) menuBtn.classList.add('active');
      });
    });

    // Hide loading screen after short delay
    const loadingScreen = document.getElementById('loadingScreen');
    setTimeout(() => {
      if (loadingScreen) loadingScreen.classList.add('hidden');
    }, 900);
  });
})();
