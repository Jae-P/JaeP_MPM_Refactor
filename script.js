// IIFE - core app logic (merged from your earlier scripts + enhancements)
(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  const panels = $$('.panel');
  const navButtons = $$('.nav-item');
  const cards = $$('.card[data-target]');
  const backButtons = $$('.back');
  const sectionTitle = $('#section-title');
  const yearEl = $('#year');
  const layoutToggle = $('#layoutToggle');

  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

  // Activate a panel by id
  function activatePanel(id){
    panels.forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(id);
    if(panel){ panel.classList.add('active'); }
    sectionTitle.textContent = id === 'menu' ? 'Main Menu' : panel?.querySelector('h2')?.textContent || 'Section';
    navButtons.forEach(b => b.classList.toggle('active', b.dataset.target === id));
    if(id==='menu'){ updateHomeProgress(); }
    window.scrollTo({top:0, behavior:'smooth'});
    localStorage.setItem('jp.last', id);
  }

  // Hook navigation/buttons
  navButtons.forEach(btn => btn.addEventListener('click', () => activatePanel(btn.dataset.target)));
  cards.forEach(card => card.addEventListener('click', () => activatePanel(card.dataset.target)));
  backButtons.forEach(btn => btn.addEventListener('click', () => activatePanel('menu')));

  if(layoutToggle){
    layoutToggle.addEventListener('click', () => {
      document.body.classList.toggle('layout-dashboard');
    });
  }

  // Profile image upload / localStorage
  const profileUpload = $('#profileUpload');
  const profileImage = $('#profileImage');

  function loadAvatar(){
    const dataUrl = localStorage.getItem('jp_profile_image');
    if(dataUrl && profileImage){
      profileImage.src = dataUrl;
    }
  }
  loadAvatar();

  if(profileUpload && profileImage){
    profileUpload.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = function(ev){
        const dataUrl = ev.target.result;
        profileImage.src = dataUrl;
        try{
          localStorage.setItem('jp_profile_image', dataUrl);
        }catch(err){
          console.warn('Could not store image in localStorage', err);
          alert('Image is too large to save. Try a smaller one.');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Profile fields we persist
  const profileFields = [
    'stageName','email','website','timezone','genre','bio',
    'spotify','apple','youtube','instagram','tiktok','facebook'
  ];

  const statKeys = { followers:'statsFollowers', streams:'statsStreams', releases:'statsReleases' };

  // Load profile values into inputs and left-side preview
  function loadProfile(){
    profileFields.forEach(id => {
      const el = document.getElementById(id);
      const val = localStorage.getItem('jp_profile_'+id);
      if(el && val !== null) el.value = val;
    });

    // Stats
    const f = localStorage.getItem('jp_stat_followers') || '';
    const s = localStorage.getItem('jp_stat_streams') || '';
    const r = localStorage.getItem('jp_stat_releases') || '';
    if($('#statsFollowers')) $('#statsFollowers').value = f || 0;
    if($('#statsStreams')) $('#statsStreams').value = s || 0;
    if($('#statsReleases')) $('#statsReleases').value = r || 0;

    updateProfileDisplay();
  }

  // Update left-side preview (name, headline, stats, socials)
  function updateProfileDisplay(){
    const stage = localStorage.getItem('jp_profile_stageName') || document.getElementById('stageName')?.value || '—';
    const genre = localStorage.getItem('jp_profile_genre') || document.getElementById('genre')?.value || '';
    const headline = genre ? genre : 'Artist';

    const artistName = $('#artistName');
    if(artistName) artistName.textContent = stage || '—';

    const profileHeadline = $('#profileHeadline');
    if(profileHeadline) profileHeadline.textContent = headline || '';

    // Stats
    const followers = localStorage.getItem('jp_stat_followers') || document.getElementById('statsFollowers')?.value || '—';
    const streams = localStorage.getItem('jp_stat_streams') || document.getElementById('statsStreams')?.value || '—';
    const releases = localStorage.getItem('jp_stat_releases') || document.getElementById('statsReleases')?.value || '—';
    $('#profileFollowers').textContent = followers || '—';
    $('#profileStreams').textContent = streams || '—';
    $('#profileReleasesCount').textContent = releases || '—';

    // Socials preview
    const socials = [
      { id:'spotify', label:'Spotify', emoji:'🎧' },
      { id:'apple', label:'Apple', emoji:'' },
      { id:'youtube', label:'YouTube', emoji:'▶️' },
      { id:'instagram', label:'Instagram', emoji:'📷' },
      { id:'tiktok', label:'TikTok', emoji:'🎵' },
      { id:'facebook', label:'Facebook', emoji:'📘' }
    ];
    const container = $('#profileSocialsPreview');
    if(!container) return;
    container.innerHTML = '';
    socials.forEach(soc => {
      const val = localStorage.getItem('jp_profile_'+soc.id) || document.getElementById(soc.id)?.value || '';
      if(val){
        const a = document.createElement('a');
        a.href = val;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'profile-social';
        a.innerHTML = `<span class="icon">${soc.emoji}</span><span class="label">${soc.label}</span>`;
        container.appendChild(a);
      }
    });
  }

  // Make profile inputs editable or readonly
  function setProfileEditable(editing){
    profileFields.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.disabled = !editing;
    });
    // Stats inputs enabled/disabled
    ['statsFollowers','statsStreams','statsReleases'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.disabled = !editing;
    });

    const editBtn = document.getElementById('editProfileBtn');
    if(editBtn){
      editBtn.classList.toggle('editing', editing);
      editBtn.textContent = editing ? 'Cancel edit' : 'Edit profile';
    }
  }

  // initial load
  loadProfile();
  setProfileEditable(false);

  // Save profile handler
  $('#saveProfile')?.addEventListener('click', (e) => {
    e.preventDefault();
    profileFields.forEach(id => {
      const el = document.getElementById(id);
      if(el) localStorage.setItem('jp_profile_'+id, el.value || '');
    });

    // Persist stats
    const sf = $('#statsFollowers')?.value || '0';
    const ss = $('#statsStreams')?.value || '0';
    const sr = $('#statsReleases')?.value || '0';
    localStorage.setItem('jp_stat_followers', String(sf));
    localStorage.setItem('jp_stat_streams', String(ss));
    localStorage.setItem('jp_stat_releases', String(sr));

    alert('Profile saved!');
    updateProfileDisplay();
    setProfileEditable(false);
  });

  // Cancel edit button
  $('#cancelEditBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    loadProfile();
    setProfileEditable(false);
  });

  // Edit button toggles edit mode and navigates to profile panel
  const editBtn = document.getElementById('editProfileBtn');
  if(editBtn){
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const editing = editBtn.classList.contains('editing');
      if(editing){
        loadProfile();
        setProfileEditable(false);
        return;
      }
      activatePanel('profile');
      setProfileEditable(true);
      const target = document.getElementById('profileEditCard');
      if(target){ target.scrollIntoView({ behavior:'smooth', block:'start' }); }
    });
  }

  // View portfolio
  $('#viewPortfolioBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    activatePanel('portfolio');
    renderPortfolio();
    const p = document.getElementById('portfolio');
    if(p) p.scrollIntoView({ behavior:'smooth', block:'start' });
  });

  /* --------------- Checklist (from your original) --------------- */
  const DEFAULT_TASKS = [
    { key:'mix',       text:'Mix & Master complete' },
    { key:'artwork',   text:'Artwork ready' },
    { key:'metadata',  text:'Final metadata (title, ISRC/UPC if available)' },
    { key:'social',    text:'Social profiles claimed & updated' },
    { key:'marketing', text:'Marketing' },
    { key:'presskit',  text:'EPK/press kit ready' },
    { key:'preSave',   text:'Pre-save / pre-order links created' },
  ];

  const checklistList = $('#checklistList');
  const newTaskInput = $('#newTaskInput');
  const addTaskBtn = $('#addTaskBtn');

  function getCustomTasks(){
    try{ return JSON.parse(localStorage.getItem('jp_custom_tasks') || '[]'); }
    catch{ return []; }
  }
  function setCustomTasks(arr){ localStorage.setItem('jp_custom_tasks', JSON.stringify(arr)); }

  function getDefaultDone(key){ return localStorage.getItem('jp_check_'+key) === '1'; }
  function setDefaultDone(key, val){ localStorage.setItem('jp_check_'+key, val ? '1' : '0'); }

  function updateProgressUI(){
    const defaultsCompleted = DEFAULT_TASKS.filter(t => getDefaultDone(t.key)).length;
    const defaultsTotal = DEFAULT_TASKS.length;
    const custom = getCustomTasks();
    const customCompleted = custom.filter(t => t.done).length;
    const customTotal = custom.length;

    const total = defaultsTotal + customTotal;
    const done = defaultsCompleted + customCompleted;
    const pct = total ? Math.round((done/total)*100) : 0;

    const fill = $('#progressFill');
    const cnt = $('#progressCount');
    const tot = $('#progressTotal');
    const fill2 = $('#progressFill2');
    const cnt2 = $('#progressCount2');
    const tot2 = $('#progressTotal2');

    [fill, fill2].forEach(el => { if(el) el.style.width = pct + '%'; });
    [cnt, cnt2].forEach(el => { if(el) el.textContent = String(done); });
    [tot, tot2].forEach(el => { if(el) el.textContent = String(total); });
  }

  function renderChecklist(){
    if(!checklistList) return;
    checklistList.innerHTML = '';

    const fragment = document.createDocumentFragment();
    const addItem = (id, text, checked, isCustom=false) => {
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
      if(isCustom){
        remove.addEventListener('click', () => {
          const arr = getCustomTasks().filter(t => t.id !== id);
          setCustomTasks(arr);
          renderChecklist();
        });
      }else{
        remove.style.visibility = 'hidden';
      }

      row.appendChild(inp);
      row.appendChild(label);
      row.appendChild(remove);
      fragment.appendChild(row);

      if(isCustom){
        inp.addEventListener('change', () => {
          const arr = getCustomTasks().map(t => t.id===id ? ({...t, done:inp.checked}) : t);
          setCustomTasks(arr);
          updateProgressUI();
        });
      }else{
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

  if(addTaskBtn && newTaskInput){
    addTaskBtn.addEventListener('click', () => {
      const txt = (newTaskInput.value || '').trim();
      if(!txt) return;
      const id = 'c_'+Date.now();
      const arr = getCustomTasks();
      arr.push({ id, text: txt, done:false });
      setCustomTasks(arr);
      newTaskInput.value = '';
      renderChecklist();
    });
    newTaskInput.addEventListener('keypress', (e) => {
      if(e.key === 'Enter'){ e.preventDefault(); addTaskBtn.click(); }
    });
  }

  function updateHomeProgress(){ updateProgressUI(); }

  /* --------------- Portfolio (unchanged but robust) --------------- */
  const PORT_KEYS = {
    releases: 'jp_portfolio_releases',
    videos: 'jp_portfolio_videos',
    epks: 'jp_portfolio_epks'
  };

  function getItems(type){
    try{ return JSON.parse(localStorage.getItem(PORT_KEYS[type]) || '[]'); } catch { return []; }
  }
  function setItems(type, arr){
    localStorage.setItem(PORT_KEYS[type], JSON.stringify(arr));
  }

  function renderPortfolio(){
    renderList('releaseList', 'releases');
    renderList('videoList', 'videos');
    renderList('epkList', 'epks');
  }

  function renderList(containerId, type){
    const container = document.getElementById(containerId);
    if(!container) return;
    const items = getItems(type);
    container.innerHTML = '';
    if(items.length === 0){
      container.innerHTML = `<div class="empty muted">No items added yet.</div>`;
      return;
    }
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'portfolio-item';

      const title = document.createElement('div');
      title.className = 'pi-title';
      title.textContent = item.title || (item.link || 'Untitled');

      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.appendChild(title);

      row.appendChild(left);

      const actions = document.createElement('div');
      actions.className = 'pi-actions';
      actions.style.display='flex';
      actions.style.gap='8px';

      if(item.link){
        const link = document.createElement('a');
        link.href = item.link;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Open';
        link.className = 'btn small';
        actions.appendChild(link);
      }

      const del = document.createElement('button');
      del.className = 'btn small';
      del.textContent = 'Delete';
      del.addEventListener('click', () => {
        const arr = getItems(type).filter(i => i.id !== item.id);
        setItems(type, arr);
        renderList(containerId, type);
      });
      actions.appendChild(del);

      row.appendChild(actions);
      container.appendChild(row);
    });
  }

  // Add handlers for add buttons
  $('#addReleaseBtn')?.addEventListener('click', () => {
    const title = (document.getElementById('releaseTitle').value || '').trim();
    const link = (document.getElementById('releaseLink').value || '').trim();
    if(!title && !link){ alert('Add a release title or link.'); return; }
    const arr = getItems('releases');
    arr.push({ id: Date.now(), title, link });
    setItems('releases', arr);
    document.getElementById('releaseTitle').value = '';
    document.getElementById('releaseLink').value = '';
    renderList('releaseList', 'releases');
  });

  $('#addVideoBtn')?.addEventListener('click', () => {
    const title = (document.getElementById('videoTitle').value || '').trim();
    const link = (document.getElementById('videoLink').value || '').trim();
    if(!link){ alert('Please add a video link (YouTube/Vimeo).'); return; }
    const arr = getItems('videos');
    arr.push({ id: Date.now(), title, link });
    setItems('videos', arr);
    document.getElementById('videoTitle').value = '';
    document.getElementById('videoLink').value = '';
    renderList('videoList', 'videos');
  });

  $('#addEpkBtn')?.addEventListener('click', () => {
    const title = (document.getElementById('epkTitle').value || '').trim();
    const link = (document.getElementById('epkLink').value || '').trim();
    if(!link){ alert('Please add an EPK link (URL to PDF or page).'); return; }
    const arr = getItems('epks');
    arr.push({ id: Date.now(), title, link });
    setItems('epks', arr);
    document.getElementById('epkTitle').value = '';
    document.getElementById('epkLink').value = '';
    renderList('epkList', 'epks');
  });

  /* ---------- Consult / booking form ---------- */
  const consultForm = $('#consultForm');
  if(consultForm){
    consultForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(consultForm));
      // Basic user-facing confirmation (replace with real submission later)
      alert(`Thanks ${data.name}! We'll reach out at ${data.email} to confirm your ${data.platform} session on ${data.datetime} at $${data.rate}/hr.`);
      consultForm.reset();
      activatePanel('menu');
    });
  }

  // Also support legacy snippet if any other booking form exists
  $('#booking-form')?.addEventListener('submit', function(e){
    e.preventDefault();
    alert("Your booking request has been submitted!");
    activatePanel('menu');
  });

  /* ---------- Number spinner control ---------- */
  // Delegate spinner clicks for plus/minus
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.spin');
    if(!btn) return;
    const targetId = btn.dataset.target;
    if(!targetId) return;
    const input = document.getElementById(targetId);
    if(!input) return;
    // Ensure it's editable (we might be toggling editing mode)
    let value = parseInt(input.value || '0', 10);
    if(isNaN(value)) value = 0;
    if(btn.classList.contains('plus')) value += parseInt(input.step || '1', 10);
    else value -= parseInt(input.step || '1', 10);
    if(value < (parseInt(input.min || '0',10))) value = parseInt(input.min || '0',10);
    input.value = value;
    // Persist immediately to localStorage for live preview
    if(targetId === 'statsFollowers') localStorage.setItem('jp_stat_followers', String(value));
    if(targetId === 'statsStreams') localStorage.setItem('jp_stat_streams', String(value));
    if(targetId === 'statsReleases') localStorage.setItem('jp_stat_releases', String(value));
    updateProfileDisplay();
  });

  /* ---------- Startup ---------- */
  const start = localStorage.getItem('jp.last') || 'menu';
  activatePanel(start);
  renderChecklist();
  renderPortfolio();
  updateProfileDisplay();

  // Hide loading screen after ready
  document.addEventListener("DOMContentLoaded", () => {
    const loadingScreen = document.getElementById('loadingScreen');
    setTimeout(() => {
      if (loadingScreen) loadingScreen.classList.add('hidden');
    }, 700);
  });

  // Back buttons that use class 'back' should navigate home (some are <button class="btn subtle back">)
  document.addEventListener('click', function(e){
    const back = e.target.closest('.back');
    if(!back) return;
    activatePanel('menu');
  });

})();
