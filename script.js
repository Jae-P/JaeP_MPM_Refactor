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
  navButtons.forEach(btn => btn.addEventListener('click', () => activatePanel(btn.dataset.target)));
  cards.forEach(card => card.addEventListener('click', () => activatePanel(card.dataset.target)));
  backButtons.forEach(btn => btn.addEventListener('click', () => activatePanel('menu')));

  if(layoutToggle){
    layoutToggle.addEventListener('click', () => {
      document.body.classList.toggle('layout-dashboard');
    });
  }
  const layoutToggle2 = document.getElementById('layoutToggle2');
  if(layoutToggle2){
    layoutToggle2.addEventListener('click', () => {
      document.body.classList.toggle('layout-dashboard');
    });
  }
  
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

  const profileFields = ['stageName','email','website','timezone'];
  function loadProfile(){
    profileFields.forEach(id => {
      const el = document.getElementById(id);
      const val = localStorage.getItem('jp_profile_'+id);
      if(el && val !== null) el.value = val;
    });
  }
  loadProfile();

  const saveProfileBtn = $('#saveProfile');
  if(saveProfileBtn){
    saveProfileBtn.addEventListener('click', () => {
      profileFields.forEach(id => {
        const el = document.getElementById(id);
        if(el) localStorage.setItem('jp_profile_'+id, el.value || '');
      });
      alert('Profile saved!');
    });
  }

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

  const consultForm = $('#consultForm');
  if(consultForm){
    consultForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(consultForm));
      alert(`Thanks ${data.name}! We'll reach out at ${data.email} to confirm your ${data.platform} session on ${data.datetime} at $${data.rate}/hr.`);
      consultForm.reset();
    });
  }

  const start = localStorage.getItem('jp.last') || 'menu';
  activatePanel(start);
  renderChecklist();
})();
document.addEventListener("DOMContentLoaded", () => {
  const navButtons = document.querySelectorAll("[data-target]");
  const panels = document.querySelectorAll(".panel");
  const sectionTitle = document.getElementById("section-title");
  const backButtons = document.querySelectorAll(".back");

  // Handle navigation
  navButtons.forEach(button => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-target");

      // Hide all panels
      panels.forEach(panel => panel.classList.remove("active"));

      // Show the target panel
      const targetPanel = document.getElementById(target);
      if (targetPanel) {
        targetPanel.classList.add("active");
        sectionTitle.textContent = targetPanel.querySelector("h2")
          ? targetPanel.querySelector("h2").textContent
          : "Main Menu";
      }

      // Update nav active state
      navButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
    });
  });

  // Handle back buttons (always go back to menu)
  backButtons.forEach(backBtn => {
    backBtn.addEventListener("click", () => {
      panels.forEach(panel => panel.classList.remove("active"));
      document.getElementById("menu").classList.add("active");
      sectionTitle.textContent = "Main Menu";

      // Reset nav active state
      navButtons.forEach(btn => btn.classList.remove("active"));
      document.querySelector('[data-target="menu"]').classList.add("active");
    });
  });

  // Auto-set copyright year
  document.getElementById("year").textContent = new Date().getFullYear();
});
// Hide loading screen after app is ready
document.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.getElementById('loadingScreen');

  // Simulate short delay for effect, then hide
  setTimeout(() => {
    if (loadingScreen) loadingScreen.classList.add('hidden');
  }, 1200); // 1.2 seconds
});
