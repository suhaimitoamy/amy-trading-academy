// Editor Engine
const Editor = {
  blocks: [],
  metadata: {
    title: '', eyebrow: '', prevLink: '', nextLink: '', sourceNote: ''
  },
  
  init() {
    ImageManager.init();
    
    this.container = document.getElementById('blocksContainer');
    this.titleInput = document.getElementById('metaTitle');
    this.eyebrowInput = document.getElementById('metaEyebrow');
    this.prevInput = document.getElementById('metaPrevLink');
    this.nextInput = document.getElementById('metaNextLink');
    this.previewContent = document.getElementById('previewContent');
    this.saveStatus = document.getElementById('saveStatus');
    this.themeSelect = document.getElementById('previewTheme');
    
    this.bindEvents();
    
    // Check URL params for existing file to load
    const urlParams = new URLSearchParams(window.location.search);
    const folder = urlParams.get('folder');
    const file = urlParams.get('file');
    
    if (folder && file) {
      document.getElementById('editorTitle').innerText = `Edit: ${file}`;
      this.loadFromServer(folder, file);
    } else {
      // Empty state
      this.addBlock('paragraph');
    }
    
    // Start auto-save
    setInterval(() => this.autoSave(), 30000);
  },
  
  bindEvents() {
    // Add block buttons
    document.querySelectorAll('#addBlockBar button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.type;
        this.addBlock(type);
      });
    });
    
    // Metadata inputs
    const updateMeta = () => {
      this.metadata.title = this.titleInput.value;
      this.metadata.eyebrow = this.eyebrowInput.value;
      this.metadata.prevLink = this.prevInput.value;
      this.metadata.nextLink = this.nextInput.value;
      this.triggerPreviewUpdate();
    };
    
    this.titleInput.addEventListener('input', updateMeta);
    this.eyebrowInput.addEventListener('input', updateMeta);
    this.prevInput.addEventListener('input', updateMeta);
    this.nextInput.addEventListener('input', updateMeta);
    
    // Export/Import
    document.getElementById('btnExport').addEventListener('click', () => this.exportHTML());
    document.getElementById('btnImport').addEventListener('click', () => document.getElementById('importFileInput').click());
    
    // GitHub Save & Settings
    document.getElementById('btnGithubSettings').addEventListener('click', () => {
      const token = localStorage.getItem('amy_github_token') || '';
      const imgbbKey = localStorage.getItem('amy_imgbb_api_key') || '';
      document.getElementById('githubTokenInput').value = token;
      document.getElementById('imgbbApiKey').value = imgbbKey;
      document.getElementById('githubModalOverlay').classList.add('active');
    });
    
    document.getElementById('githubModalClose').addEventListener('click', () => {
      document.getElementById('githubModalOverlay').classList.remove('active');
    });
    
    document.getElementById('githubModalCancel').addEventListener('click', () => {
      document.getElementById('githubModalOverlay').classList.remove('active');
    });
    
    document.getElementById('githubModalSave').addEventListener('click', () => {
      const token = document.getElementById('githubTokenInput').value.trim();
      const imgbbKey = document.getElementById('imgbbApiKey').value.trim();
      
      if (token) {
        localStorage.setItem('amy_github_token', token);
      } else {
        localStorage.removeItem('amy_github_token');
      }
      
      if (imgbbKey) {
        localStorage.setItem('amy_imgbb_api_key', imgbbKey);
      } else {
        localStorage.removeItem('amy_imgbb_api_key');
      }
      
      document.getElementById('githubModalOverlay').classList.remove('active');
      this.showToast('Pengaturan Editor disimpan lokal', 'success');
    });
    
    document.getElementById('btnSaveGithub').addEventListener('click', () => this.saveToGithub());
    
    document.getElementById('importFileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      this.currentFileName = file.name;
      document.getElementById('editorTitle').innerText = `Edit: ${this.currentFileName}`;
      
      const reader = new FileReader();
      reader.onload = (ev) => this.importHTML(ev.target.result);
      reader.readAsText(file);
    });
    
    // Theme switch
    this.themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      const iframeDoc = this.previewContent.ownerDocument; // We are rendering directly into a div, so just update body dataset
      if (theme) {
        document.documentElement.dataset.theme = theme;
      } else {
        delete document.documentElement.dataset.theme;
      }
    });

    // Mobile toggle preview
    const btnToggle = document.getElementById('btnTogglePreview');
    btnToggle.addEventListener('click', () => {
      const layout = document.getElementById('editorLayout');
      layout.classList.toggle('show-preview');
      btnToggle.innerText = layout.classList.contains('show-preview') ? '📝 Editor' : '👁️ Preview';
    });
    
    if (window.innerWidth <= 900) {
      btnToggle.style.display = 'block';
    }
  },
  
  generateId() {
    return 'block_' + Math.random().toString(36).substr(2, 9);
  },
  
  addBlock(type, afterId = null, initialContent = '') {
    const newBlock = {
      id: this.generateId(),
      type: type,
      content: initialContent
    };
    
    if (type === 'list') {
      newBlock.listType = 'ul';
      newBlock.listItems = [''];
    }
    
    if (afterId) {
      const index = this.blocks.findIndex(b => b.id === afterId);
      if (index !== -1) {
        this.blocks.splice(index + 1, 0, newBlock);
      } else {
        this.blocks.push(newBlock);
      }
    } else {
      this.blocks.push(newBlock);
    }
    
    this.renderBlocks();
    
    // Focus new block
    setTimeout(() => {
      const el = document.getElementById(newBlock.id);
      if (el) {
        const editable = el.querySelector('.block-content');
        if (editable) editable.focus();
      }
    }, 50);
  },
  
  removeBlock(id) {
    this.blocks = this.blocks.filter(b => b.id !== id);
    this.renderBlocks();
    this.triggerPreviewUpdate();
  },
  
  moveBlock(id, direction) {
    const index = this.blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    
    if (direction === 'up' && index > 0) {
      const temp = this.blocks[index];
      this.blocks[index] = this.blocks[index - 1];
      this.blocks[index - 1] = temp;
    } else if (direction === 'down' && index < this.blocks.length - 1) {
      const temp = this.blocks[index];
      this.blocks[index] = this.blocks[index + 1];
      this.blocks[index + 1] = temp;
    }
    
    this.renderBlocks();
    this.triggerPreviewUpdate();
  },
  
  updateBlockContent(id, content) {
    const block = this.blocks.find(b => b.id === id);
    if (block) {
      block.content = content;
      this.triggerPreviewUpdate();
    }
  },
  
  updateListBlock(id, index, content) {
    const block = this.blocks.find(b => b.id === id);
    if (block && block.listItems) {
      block.listItems[index] = content;
      this.triggerPreviewUpdate();
    }
  },
  
  renderBlocks() {
    this.container.innerHTML = '';
    
    this.blocks.forEach(block => {
      const blockEl = document.createElement('div');
      blockEl.className = 'editor-block';
      blockEl.id = block.id;
      blockEl.dataset.type = block.type;
      
      const typeIndicator = document.createElement('div');
      typeIndicator.className = 'block-type-indicator';
      typeIndicator.innerText = block.type;
      blockEl.appendChild(typeIndicator);
      
      const actions = document.createElement('div');
      actions.className = 'block-actions';
      actions.innerHTML = `
        <button onclick="Editor.moveBlock('${block.id}', 'up')" title="Move Up">↑</button>
        <button onclick="Editor.moveBlock('${block.id}', 'down')" title="Move Down">↓</button>
        <button onclick="Editor.removeBlock('${block.id}')" class="delete" title="Delete">❌</button>
      `;
      blockEl.appendChild(actions);
      
      if (block.type === 'list') {
        const listContainer = document.createElement('div');
        block.listItems.forEach((item, index) => {
          const itemEl = document.createElement('div');
          itemEl.style.display = 'flex';
          itemEl.style.gap = '8px';
          itemEl.style.marginBottom = '4px';
          itemEl.innerHTML = `
            <span style="color:var(--text-muted)">•</span>
            <div class="block-content" contenteditable="true" style="flex:1" data-placeholder="List item...">${item}</div>
          `;
          
          const editable = itemEl.querySelector('.block-content');
          editable.addEventListener('input', (e) => this.updateListBlock(block.id, index, e.target.innerHTML));
          
          editable.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              block.listItems.splice(index + 1, 0, '');
              this.renderBlocks();
              // focus next
            } else if (e.key === 'Backspace' && editable.innerHTML === '') {
              e.preventDefault();
              if (block.listItems.length > 1) {
                block.listItems.splice(index, 1);
                this.renderBlocks();
              } else {
                this.removeBlock(block.id);
              }
            }
          });
          
          listContainer.appendChild(itemEl);
        });
        blockEl.appendChild(listContainer);
        
      } else if (block.type === 'image') {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'image-block';
        
        if (block.imageUrl) {
          imgContainer.innerHTML = `
            <img src="${block.imageUrl}">
            ${block.imageCaption ? `<div style="font-size:12px; color:var(--text-muted); margin-top:8px;">${block.imageCaption}</div>` : ''}
            <div class="image-controls">
              <button onclick="Editor.editImage('${block.id}')">⚙️ Edit Gambar</button>
            </div>
          `;
        } else {
          imgContainer.innerHTML = `
            <div class="placeholder" onclick="Editor.editImage('${block.id}')">
              <div style="font-size:24px;">🖼️</div>
              <div>Klik untuk upload gambar</div>
            </div>
          `;
        }
        blockEl.appendChild(imgContainer);
        
      } else {
        // Text blocks (paragraph, heading, warning, note, blockquote)
        const contentEl = document.createElement('div');
        contentEl.className = `block-content ${block.type}-content`;
        contentEl.contentEditable = true;
        contentEl.innerHTML = block.content;
        contentEl.dataset.placeholder = `Type ${block.type} here...`;
        
        contentEl.addEventListener('input', (e) => this.updateBlockContent(block.id, e.target.innerHTML));
        contentEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.addBlock('paragraph', block.id);
          } else if (e.key === 'Backspace' && contentEl.innerHTML === '') {
            e.preventDefault();
            this.removeBlock(block.id);
          }
        });
        
        // Focus state
        contentEl.addEventListener('focus', () => blockEl.classList.add('selected'));
        contentEl.addEventListener('blur', () => blockEl.classList.remove('selected'));
        
        blockEl.appendChild(contentEl);
      }
      
      this.container.appendChild(blockEl);
      
      // Add inline + button
      const addBtn = document.createElement('div');
      addBtn.className = 'add-block-btn';
      addBtn.innerHTML = '+';
      addBtn.onclick = () => this.addBlock('paragraph', block.id);
      this.container.appendChild(addBtn);
    });
    
    this.triggerPreviewUpdate();
  },
  
  editImage(blockId) {
    const block = this.blocks.find(b => b.id === blockId);
    if (!block) return;
    
    ImageManager.showModal(block, (newData) => {
      block.imageUrl = newData.imageUrl;
      block.imageCaption = newData.imageCaption;
      block.imageSize = newData.imageSize;
      block.imagePosition = newData.imagePosition;
      
      this.renderBlocks();
      this.triggerPreviewUpdate();
    });
  },
  
  // Preview
  previewTimeout: null,
  triggerPreviewUpdate() {
    clearTimeout(this.previewTimeout);
    this.previewTimeout = setTimeout(() => {
      this.updatePreview();
      this.saveStatus.innerText = '• Perubahan belum disimpan';
    }, 300);
  },
  
  updatePreview() {
    const html = HtmlIO.exportHtml(this.metadata, this.blocks);
    
    // We only want the inner part of article for the preview div
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const article = doc.querySelector('.article');
    
    if (article) {
      this.previewContent.innerHTML = article.innerHTML;
    }
  },
  
  // I/O
  importHTML(htmlString) {
    const result = HtmlIO.importHtml(htmlString);
    this.metadata = result.metadata;
    this.blocks = result.blocks;
    
    this.titleInput.value = this.metadata.title;
    this.eyebrowInput.value = this.metadata.eyebrow;
    this.prevInput.value = this.metadata.prevLink;
    this.nextInput.value = this.metadata.nextLink;
    
    this.renderBlocks();
    this.showToast('HTML berhasil di-import', 'success');
  },
  
  exportHTML() {
    const html = HtmlIO.exportHtml(this.metadata, this.blocks);
    
    // Create download link
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const urlParams = new URLSearchParams(window.location.search);
    const fileName = urlParams.get('file') || 'materi-export.html';
    
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.saveStatus.innerText = '✓ Tersimpan';
    this.showToast(`HTML diekspor sebagai ${fileName}`, 'success');
  },
  
  saveToGithub() {
    const urlParams = new URLSearchParams(window.location.search);
    const folder = urlParams.get('folder');
    // Prioritas path save: Gunakan "folder" + "file" dari URL editor secara absolut
    const file = urlParams.get('file');
    
    if (!folder || !file) {
      alert("Error: Folder atau file tidak ditemukan di URL. Anda harus membuka materi melalui Dashboard Admin.");
      return;
    }
    
    const token = localStorage.getItem('amy_github_token');
    if (!token) {
      alert("GitHub token belum diisi. Silakan klik tombol ⚙️ Pengaturan Editor.");
      return;
    }
    
    const html = HtmlIO.exportHtml(this.metadata, this.blocks);
    
    // Validasi gambar base64
    if (html.includes('data:image/') || html.includes('base64,')) {
      alert('Peringatan: Gambar masih base64. Upload ke ImgBB dulu.');
      this.saveStatus.innerText = '❌ Gagal menyimpan';
      return;
    }
    
    const actualFilePath = `${folder}/${file}`;
    
    const confirmMsg = `File website yang akan diupdate:\n${actualFilePath}\n\nLanjutkan?`;
    if (!confirm(confirmMsg)) {
      this.saveStatus.innerText = 'Batal menyimpan';
      return;
    }
    
    // Encode UTF-8 to Base64 safely
    const encoder = new TextEncoder();
    const data = encoder.encode(html);
    let binary = '';
    for (let i = 0; i < data.byteLength; i++) {
      binary += String.fromCharCode(data[i]);
    }
    const contentBase64 = btoa(binary);
    
    this.saveStatus.innerText = 'Menyimpan ke GitHub...';
    
    fetch('https://api.github.com/repos/suhaimitoamy/amy-trading-academy/actions/workflows/save-html.yml/dispatches', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          file_path: actualFilePath,
          content_base64: contentBase64,
          commit_message: `Update materi: ${file} dari Admin Editor`
        }
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      this.saveStatus.innerText = '✓ Berhasil dikirim ke GitHub Actions';
      this.showToast('Berhasil dikirim ke GitHub Actions. Tunggu beberapa saat.', 'success');
    })
    .catch(err => {
      console.error(err);
      this.saveStatus.innerText = '❌ Gagal menyimpan';
      alert('Gagal mengirim ke GitHub. Pastikan token benar dan memiliki akses repo.');
    });
  },
  
  async loadFromServer(folder, file) {
    try {
      this.saveStatus.innerText = 'Memuat...';
      const response = await fetch(`../${folder}/${file}`);
      if (response.ok) {
        const html = await response.text();
        this.importHTML(html);
        this.saveStatus.innerText = '✓ Dimuat';
      } else {
        throw new Error('File not found');
      }
    } catch (err) {
      this.showToast('Gagal memuat file dari server. Mulai dokumen kosong.', 'error');
      this.addBlock('paragraph');
      this.saveStatus.innerText = 'Gagal memuat';
    }
  },
  
  autoSave() {
    const urlParams = new URLSearchParams(window.location.search);
    const folder = urlParams.get('folder');
    const file = urlParams.get('file');
    const key = `amy_admin_draft_${folder || 'new'}_${file || 'materi'}`;
    
    const data = {
      metadata: this.metadata,
      blocks: this.blocks
    };
    
    localStorage.setItem(key, JSON.stringify(data));
  },
  
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

document.addEventListener('DOMContentLoaded', () => Editor.init());
