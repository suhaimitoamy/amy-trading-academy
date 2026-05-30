/* ===== AMY TRADING ACADEMY — MAIN.JS ===== */
/* Theme Switcher | Hamburger Menu | Image Slot System */

(function() {
  'use strict';

  /* ==========================================
     SECTION 1: THEME SYSTEM (15 THEMES)
     ========================================== */

  const THEMES = [
    { id: '', name: 'Emerald Light', color: '#1a7a4a', bg: '#f4f6f1' },
    { id: 'gold-luxury', name: 'Gold Luxury', color: '#b8860b', bg: '#faf6ed' },
    { id: 'midnight-green', name: 'Midnight Green', color: '#4eca8b', bg: '#0d1f17' },
    { id: 'black-gold', name: 'Black Gold', color: '#d4a832', bg: '#08080a' },
    { id: 'soft-blue', name: 'Soft Blue', color: '#3574c4', bg: '#f0f4fa' },
    { id: 'cream-classic', name: 'Cream Classic', color: '#8b6914', bg: '#f5f0e6' },
    { id: 'forest-premium', name: 'Forest Premium', color: '#5dba7d', bg: '#0f1a12' },
    { id: 'ocean-clean', name: 'Ocean Clean', color: '#0e8a9e', bg: '#f0f6f8' },
    { id: 'coffee-editorial', name: 'Coffee Editorial', color: '#8b5e3c', bg: '#f2ece4' },
    { id: 'purple-focus', name: 'Purple Focus', color: '#9b7ae4', bg: '#12101a' },
    { id: 'rose-calm', name: 'Rose Calm', color: '#c46a7a', bg: '#faf4f5' },
    { id: 'slate-modern', name: 'Slate Modern', color: '#4a5a6a', bg: '#f2f3f5' },
    { id: 'white-minimal', name: 'White Minimal', color: '#222222', bg: '#ffffff' },
    { id: 'dark-academy', name: 'Dark Academy', color: '#c8a86e', bg: '#1a1510' },
    { id: 'trading-desk', name: 'Trading Desk', color: '#00e676', bg: '#0a0e14' }
  ];

  function getCurrentTheme() {
    return localStorage.getItem('amy_theme') || '';
  }

  function setTheme(themeId) {
    if (themeId) {
      document.documentElement.dataset.theme = themeId;
      localStorage.setItem('amy_theme', themeId);
    } else {
      delete document.documentElement.dataset.theme;
      localStorage.removeItem('amy_theme');
    }
  }

  function createThemePanel() {
    // Overlay
    var overlay = document.createElement('div');
    overlay.className = 'theme-panel-overlay';
    overlay.id = 'themePanelOverlay';
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeThemePanel();
    });

    // Panel
    var panel = document.createElement('div');
    panel.className = 'theme-panel';
    panel.innerHTML = '<h3>🎨 Pilih Tema</h3>';

    // Grid
    var grid = document.createElement('div');
    grid.className = 'theme-grid';

    var current = getCurrentTheme();
    THEMES.forEach(function(theme) {
      var opt = document.createElement('button');
      opt.className = 'theme-option' + (theme.id === current ? ' active' : '');
      opt.dataset.themeId = theme.id;
      opt.innerHTML =
        '<span class="theme-swatch" style="background:linear-gradient(135deg,' + theme.bg + ',' + theme.color + ')"></span>' +
        '<span>' + theme.name + '</span>';
      opt.addEventListener('click', function() {
        setTheme(theme.id);
        grid.querySelectorAll('.theme-option').forEach(function(o) { o.classList.remove('active'); });
        opt.classList.add('active');
      });
      grid.appendChild(opt);
    });

    panel.appendChild(grid);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'theme-panel-close';
    closeBtn.textContent = 'Tutup';
    closeBtn.addEventListener('click', closeThemePanel);
    panel.appendChild(closeBtn);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  function openThemePanel() {
    var overlay = document.getElementById('themePanelOverlay');
    if (overlay) overlay.classList.add('active');
  }

  function closeThemePanel() {
    var overlay = document.getElementById('themePanelOverlay');
    if (overlay) overlay.classList.remove('active');
  }

  function injectThemeToggle() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var navlinks = nav.querySelector('.navlinks');
    if (!navlinks) return;

    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.id = 'themeToggleBtn';
    btn.innerHTML = '🎨 Tema';
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      openThemePanel();
    });

    // Insert before hamburger or at end of nav
    var hamburger = nav.querySelector('.hamburger');
    if (hamburger) {
      nav.insertBefore(btn, hamburger);
    } else {
      nav.appendChild(btn);
    }
  }

  /* ==========================================
     SECTION 2: HAMBURGER MENU
     ========================================== */

  function initHamburger() {
    var hamburger = document.getElementById('hamburger');
    var navlinks = document.getElementById('navlinks');
    if (!hamburger || !navlinks) return;

    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      navlinks.classList.toggle('open');
      document.body.style.overflow = navlinks.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu when clicking nav links
    navlinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        navlinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ==========================================
     SECTION 3: IMAGE SLOT SYSTEM
     ========================================== */

  var DB_NAME = 'AmyAcademyImages';
  var DB_VERSION = 1;
  var STORE_NAME = 'images';

  function openDB() {
    return new Promise(function(resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  }

  function saveImageToDB(path, dataUrl) {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(dataUrl, path);
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  function getImageFromDB(path) {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var req = tx.objectStore(STORE_NAME).get(path);
        req.onsuccess = function(e) { resolve(e.target.result || null); };
        req.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  function initImageSlots() {
    var slots = document.querySelectorAll('.image-slot');
    slots.forEach(function(slot) {
      var imgPath = slot.dataset.imgPath || '';
      var prompt = slot.dataset.prompt || '';
      var caption = slot.dataset.caption || '';
      var rootPath = (typeof ROOT_PATH !== 'undefined') ? ROOT_PATH : '';

      renderSlot(slot, imgPath, prompt, caption, rootPath);
    });
  }

  function renderSlot(container, imgPath, prompt, caption, rootPath) {
    container.innerHTML = '';

    // Try to load from server path first, then from IndexedDB
    var fullPath = rootPath + imgPath;

    // Check IndexedDB first
    getImageFromDB(imgPath).then(function(dbImage) {
      if (dbImage) {
        showImage(container, dbImage, caption, prompt, imgPath);
        return;
      }

      // Try loading from server
      if (imgPath) {
        var testImg = new Image();
        testImg.onload = function() {
          showImage(container, fullPath, caption, prompt, imgPath);
        };
        testImg.onerror = function() {
          showPlaceholder(container, imgPath, prompt, caption);
        };
        testImg.src = fullPath;
      } else {
        showPlaceholder(container, imgPath, prompt, caption);
      }
    }).catch(function() {
      showPlaceholder(container, imgPath, prompt, caption);
    });
  }

  function showImage(container, src, caption, prompt, imgPath) {
    var html = '<img src="' + escHtml(src) + '" alt="' + escHtml(caption || 'Ilustrasi materi') + '" loading="lazy">';
    if (caption) html += '<p class="slot-caption">' + escHtml(caption) + '</p>';

    var actionsHtml = '<div class="image-slot-actions">';
    actionsHtml += '<button class="btn sm ghost slot-upload-btn">📷 Ganti Gambar</button>';
    if (prompt) {
      actionsHtml += '<button class="btn sm ghost slot-prompt-btn">📝 Lihat Prompt</button>';
    }
    actionsHtml += '</div>';

    if (prompt) {
      actionsHtml += '<details class="prompt-box"><summary>Prompt gambar</summary><div class="prompt-content">' +
        '<p>' + escHtml(prompt) + '</p>' +
        '<button class="btn sm slot-copy-prompt" style="margin-top:8px">📋 Copy Prompt</button>' +
        '</div></details>';
    }

    container.innerHTML = html + actionsHtml;
    bindSlotEvents(container, imgPath, prompt, caption);
  }

  function showPlaceholder(container, imgPath, prompt, caption) {
    var html = '<div class="image-slot-placeholder">';
    html += '<div class="slot-icon">🖼️</div>';
    html += '<div class="slot-text">Gambar belum tersedia</div>';
    if (imgPath) html += '<div class="slot-path">' + escHtml(imgPath) + '</div>';

    html += '<div class="image-slot-actions">';
    html += '<button class="btn sm primary slot-upload-btn">📷 Upload Gambar</button>';
    if (prompt) {
      html += '<button class="btn sm ghost slot-prompt-btn">📝 Lihat Prompt</button>';
      html += '<button class="btn sm ghost slot-copy-prompt">📋 Copy Prompt</button>';
    }
    html += '</div>';

    if (prompt) {
      html += '<details class="prompt-box" style="margin-top:12px;text-align:left"><summary>Prompt gambar</summary><div class="prompt-content">' +
        '<p>' + escHtml(prompt) + '</p></div></details>';
    }

    html += '</div>';
    container.innerHTML = html;
    bindSlotEvents(container, imgPath, prompt, caption);
  }

  function bindSlotEvents(container, imgPath, prompt, caption) {
    // Upload button
    var uploadBtns = container.querySelectorAll('.slot-upload-btn');
    uploadBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
          var file = e.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function(ev) {
            var dataUrl = ev.target.result;
            saveImageToDB(imgPath, dataUrl).then(function() {
              showImage(container, dataUrl, caption, prompt, imgPath);
            }).catch(function() {
              showImage(container, dataUrl, caption, prompt, imgPath);
            });
          };
          reader.readAsDataURL(file);
        };
        input.click();
      });
    });

    // Copy prompt buttons
    var copyBtns = container.querySelectorAll('.slot-copy-prompt');
    copyBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (navigator.clipboard && prompt) {
          navigator.clipboard.writeText(prompt).then(function() {
            btn.textContent = '✅ Copied!';
            setTimeout(function() { btn.textContent = '📋 Copy Prompt'; }, 2000);
          });
        }
      });
    });
  }

  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ==========================================
     SECTION 4: INITIALIZATION
     ========================================== */

  function init() {
    createThemePanel();
    injectThemeToggle();
    initHamburger();
    initImageSlots();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
