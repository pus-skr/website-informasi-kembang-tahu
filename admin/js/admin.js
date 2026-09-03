/* ============================================
   KEMBANG TAHU PANAMBANGAN - ADMIN JS
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Login Form Handling ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const btn = document.getElementById('btn-login');
            const spinner = document.getElementById('login-spinner');
            const errorMsg = document.getElementById('login-error');
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // UI Loading state
            btn.disabled = true;
            spinner.classList.remove('hidden');
            errorMsg.classList.add('hidden');
            
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, rememberMe: document.getElementById('rememberMe')?.checked === true })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    window.location.href = 'dashboard.html';
                } else {
                    errorMsg.textContent = data.message || 'Login gagal';
                    errorMsg.classList.remove('hidden');
                    btn.disabled = false;
                    spinner.classList.add('hidden');
                }
            })
            .catch(err => {
                console.error(err);
                errorMsg.textContent = 'Terjadi kesalahan sistem';
                errorMsg.classList.remove('hidden');
                btn.disabled = false;
                spinner.classList.add('hidden');
            });
        });
    }

    // --- Protected Pages Auth Check ---
    const isProtectedPage = !window.location.pathname.endsWith('index.html') && window.location.pathname.includes('/admin/');
    if (isProtectedPage) {
        fetch('/api/check-auth')
            .then(res => res.json())
            .then(data => {
                if (!data.authenticated) {
                    window.location.href = 'index.html';
                } else {
                    initDashboard();
                    initCurrentPage();
                }
            })
            .catch(err => {
                // If auth check fails (e.g. PHP not running), still try to init the page
                console.warn('Auth check failed, proceeding anyway:', err);
                initCurrentPage();
            });
    }
    
    // --- Logout Handling ---
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function(e) {
            e.preventDefault();
            fetch('/api/logout')
                .then(() => {
                    window.location.href = 'index.html';
                });
        });
    }

    // --- Delete Confirmation Modal Setup ---
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', function() {
            hideDeleteModal();
            
            if (deleteTargetType === 'umkm') {
                umkmDataAdmin = umkmDataAdmin.filter(u => u.id != deleteTargetId);
                saveUMKMDataToServer();
            } else if (deleteTargetType === 'proses') {
                prosesDataAdmin = prosesDataAdmin.filter(p => p.id != deleteTargetId);
                saveProsesDataToServer();
            } else if (deleteTargetType === 'galeri') {
                galeriDataAdmin = galeriDataAdmin.filter(g => g.id != deleteTargetId);
                saveGaleriDataToServer();
            }
        });
    }
});

// --- Delete Modal State ---
let deleteTargetType = null;
let deleteTargetId = null;
let deleteConfirmModalInstance = null;

function showDeleteModal(type, id) {
    deleteTargetType = type;
    deleteTargetId = id;
    const modalEl = document.getElementById('deleteConfirmModal');
    if (modalEl) {
        modalEl.classList.remove('hidden');
        modalEl.classList.add('flex');
    }
}

function hideDeleteModal() {
    const modalEl = document.getElementById('deleteConfirmModal');
    if (modalEl) {
        modalEl.classList.add('hidden');
        modalEl.classList.remove('flex');
    }
}

// --- Dashboard Logic ---
function initDashboard() {
    // Only run if we are on dashboard.html
    if (!window.location.pathname.endsWith('dashboard.html')) return;
    
    // Load summary stats from JSONs
    Promise.all([
        fetch('../data/umkm.json').then(res => res.json()),
        fetch('../data/galeri.json').then(res => res.json()),
        fetch('../data/proses.json').then(res => res.json())
    ]).then(results => {
        const umkmData = results[0] || [];
        const galeriData = results[1] || [];
        const prosesData = results[2] || [];
        
        document.getElementById('stat-umkm').textContent = umkmData.length;
        document.getElementById('stat-galeri').textContent = galeriData.length;
        document.getElementById('stat-proses').textContent = prosesData.length;
    }).catch(err => {
        console.error('Failed to load stats', err);
    });
}

// =========================================
//  PAGE-SPECIFIC INIT DISPATCHER
// =========================================
function initCurrentPage() {
    const path = window.location.pathname;
    if (path.endsWith('umkm.html')) {
        loadUMKMData();
        document.getElementById('btn-save-umkm').addEventListener('click', saveUMKM);
    } else if (path.endsWith('sejarah.html')) {
        loadSejarahData();
        document.getElementById('btn-save-sejarah').addEventListener('click', saveSejarah);
    } else if (path.endsWith('proses.html')) {
        loadProsesData();
        document.getElementById('btn-save-proses').addEventListener('click', saveProses);
    } else if (path.endsWith('galeri.html')) {
        loadGaleriData();
        document.getElementById('btn-save-galeri').addEventListener('click', saveGaleri);
    }
}

// =========================================
//  UMKM CRUD LOGIC
// =========================================
let umkmDataAdmin = [];
let umkmModalInstance = null;

function loadUMKMData() {
    fetch('../data/umkm.json?t=' + Date.now())
        .then(res => res.json())
        .then(data => {
            umkmDataAdmin = data;
            renderUMKMTable();
        })
        .catch(err => {
            document.getElementById('umkm-table-body').innerHTML = '<tr><td colspan="5" class="text-center text-danger">Gagal memuat data</td></tr>';
        });
}

function renderUMKMTable() {
    const tbody = document.getElementById('umkm-table-body');
    if (!tbody) return;
    
    if (umkmDataAdmin.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-space-lg py-space-xl text-center text-on-surface-variant font-body-sm text-body-sm"><span class="material-symbols-outlined text-[40px] block mb-2 text-outline">inventory_2</span>Belum ada data UMKM. Klik "Tambah UMKM" untuk mulai.</td></tr>`;
        return;
    }
    
    let html = '';
    umkmDataAdmin.forEach(item => {
        const isActive = item.status === 'aktif';
        const badgeClass = isActive ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant';
        const statusText = isActive ? 'Aktif' : 'Nonaktif';
        
        html += `
            <tr class="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                <td class="px-space-lg py-4 font-body-sm text-body-sm text-on-surface font-semibold">${item.nama}</td>
                <td class="px-space-lg py-4 font-body-sm text-body-sm text-on-surface-variant hidden md:table-cell">${item.pemilik}</td>
                <td class="px-space-lg py-4 font-body-sm text-body-sm text-on-surface-variant hidden lg:table-cell">${item.lokasi}</td>
                <td class="px-space-lg py-4 hidden sm:table-cell">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm ${badgeClass}">${statusText}</span>
                </td>
                <td class="px-space-lg py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button type="button" onclick="openUmkmModal(${item.id})" class="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center" title="Edit">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button type="button" onclick="deleteUMKM(${item.id})" class="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant hover:bg-error-container hover:text-error transition-colors flex items-center justify-center" title="Hapus">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

window.openUmkmModal = function(id = null) {
    const form = document.getElementById('umkm-form');
    form.reset();
    
    if (id) {
        document.getElementById('umkmModalLabel').textContent = 'Edit UMKM';
        const item = umkmDataAdmin.find(u => u.id == id);
        if (item) {
            document.getElementById('umkm-id').value = item.id;
            document.getElementById('umkm-nama').value = item.nama || '';
            document.getElementById('umkm-pemilik').value = item.pemilik || '';
            document.getElementById('umkm-whatsapp').value = item.whatsapp || '';
            document.getElementById('umkm-status').value = item.status || 'aktif';
            document.getElementById('umkm-lokasi').value = item.lokasi || '';
            document.getElementById('umkm-produk').value = item.produk || '';
            document.getElementById('umkm-deskripsi').value = item.deskripsi || '';
        }
    } else {
        document.getElementById('umkmModalLabel').textContent = 'Tambah UMKM';
        document.getElementById('umkm-id').value = '';
    }
    
    const modalEl = document.getElementById('umkmModal');
    modalEl.classList.remove('hidden');
    modalEl.classList.add('flex');
};

window.deleteUMKM = function(id) {
    showDeleteModal('umkm', id);
};

function saveUMKM() {
    const form = document.getElementById('umkm-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const id = document.getElementById('umkm-id').value;
    const item = {
        nama: document.getElementById('umkm-nama').value,
        pemilik: document.getElementById('umkm-pemilik').value,
        whatsapp: document.getElementById('umkm-whatsapp').value,
        status: document.getElementById('umkm-status').value,
        lokasi: document.getElementById('umkm-lokasi').value,
        produk: document.getElementById('umkm-produk').value,
        deskripsi: document.getElementById('umkm-deskripsi').value
    };
    
    if (id) {
        // Update existing
        const index = umkmDataAdmin.findIndex(u => u.id == id);
        if (index !== -1) {
            item.id = parseInt(id); // preserve ID
            umkmDataAdmin[index] = item;
        }
    } else {
        // Add new
        // Find max id
        let maxId = 0;
        umkmDataAdmin.forEach(u => { if (u.id > maxId) maxId = u.id; });
        item.id = maxId + 1;
        umkmDataAdmin.push(item);
    }
    
    saveUMKMDataToServer();
    const modalEl = document.getElementById('umkmModal');
    modalEl.classList.add('hidden');
    modalEl.classList.remove('flex');
}

function saveUMKMDataToServer() {
    const btnSave = document.getElementById('btn-save-umkm');
    if(btnSave) btnSave.disabled = true;
    
    fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'umkm', payload: umkmDataAdmin })
    })
    .then(res => res.json())
    .then(data => {
        if(btnSave) btnSave.disabled = false;
        if (data.success) {
            renderUMKMTable();
        } else {
            alert('Gagal menyimpan: ' + data.message);
        }
    })
    .catch(err => {
        if(btnSave) btnSave.disabled = false;
        alert('Terjadi kesalahan koneksi');
        console.error(err);
    });
}

// =========================================
//  SEJARAH CRUD LOGIC (Single Object)
// =========================================
let sejarahDataAdmin = null;

function loadSejarahData() {
    fetch('../data/sejarah.json?t=' + Date.now())
        .then(res => res.json())
        .then(data => {
            sejarahDataAdmin = data;
            
            // Populate form if data exists and is not an array
            if (data && !Array.isArray(data)) {
                document.getElementById('sejarah-judul').value = data.judul || '';
                document.getElementById('sejarah-deskripsi').value = data.deskripsi || '';
            } else {
                // If it was an array (old format), reset it
                document.getElementById('sejarah-judul').value = 'Sejarah Singkat';
                document.getElementById('sejarah-deskripsi').value = '';
            }
        })
        .catch(err => {
            console.error('Gagal memuat data sejarah', err);
        });
}

function saveSejarah() {
    const form = document.getElementById('sejarah-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    sejarahDataAdmin = {
        judul: document.getElementById('sejarah-judul').value,
        deskripsi: document.getElementById('sejarah-deskripsi').value
    };
    
    const btnSave = document.getElementById('btn-save-sejarah');
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menyimpan...';
    btnSave.disabled = true;
    
    fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sejarah', payload: sejarahDataAdmin })
    })
    .then(res => res.json())
    .then(data => {
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
        
        if (data.success) {
            alert('Sejarah berhasil disimpan!');
        } else {
            alert('Gagal menyimpan: ' + data.message);
        }
    })
    .catch(err => {
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
        alert('Terjadi kesalahan koneksi saat menyimpan sejarah.');
        console.error(err);
    });
}

// =========================================
//  PROSES CRUD LOGIC
// =========================================
let prosesDataAdmin = [];
let prosesModalInstance = null;

function loadProsesData() {
    fetch('../data/proses.json?t=' + Date.now())
        .then(res => res.json())
        .then(data => {
            prosesDataAdmin = data;
            renderProsesTable();
        })
        .catch(err => {
            document.getElementById('proses-table-body').innerHTML = '<tr><td colspan="5" class="text-center text-danger">Gagal memuat data</td></tr>';
        });
}

function renderProsesTable() {
    const tbody = document.getElementById('proses-table-body');
    if (!tbody) return;
    
    if (prosesDataAdmin.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-space-lg py-space-xl text-center text-on-surface-variant font-body-sm text-body-sm"><span class="material-symbols-outlined text-[40px] block mb-2 text-outline">inventory_2</span>Belum ada data proses produksi.</td></tr>`;
        return;
    }
    
    let html = '';
    prosesDataAdmin.forEach(item => {
        html += `
            <tr class="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                <td class="px-space-lg py-4 font-body-sm text-body-sm text-on-surface font-bold">${item.nomor}</td>
                <td class="px-space-lg py-4 hidden sm:table-cell"><span class="material-symbols-outlined text-primary text-[24px]">${item.icon || 'settings'}</span></td>
                <td class="px-space-lg py-4 font-body-sm text-body-sm text-on-surface font-semibold">${item.nama}</td>
                <td class="px-space-lg py-4 font-body-sm text-body-sm text-on-surface-variant hidden md:table-cell">${item.deskripsi}</td>
                <td class="px-space-lg py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button type="button" onclick="openProsesModal(${item.id})" class="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center" title="Edit">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button type="button" onclick="deleteProses(${item.id})" class="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant hover:bg-error-container hover:text-error transition-colors flex items-center justify-center" title="Hapus">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

window.openProsesModal = function(id = null) {
    const form = document.getElementById('proses-form');
    form.reset();
    
    if (id) {
        document.getElementById('prosesModalLabel').textContent = 'Edit Proses';
        const item = prosesDataAdmin.find(p => p.id == id);
        if (item) {
            document.getElementById('proses-id').value = item.id;
            document.getElementById('proses-nomor').value = item.nomor || '';
            document.getElementById('proses-nama').value = item.nama || '';
            document.getElementById('proses-icon').value = item.icon || '';
            document.getElementById('proses-deskripsi').value = item.deskripsi || '';
        }
    } else {
        document.getElementById('prosesModalLabel').textContent = 'Tambah Proses';
        document.getElementById('proses-id').value = '';
    }
    
    const modalEl = document.getElementById('prosesModal');
    modalEl.classList.remove('hidden');
    modalEl.classList.add('flex');
};

window.deleteProses = function(id) {
    showDeleteModal('proses', id);
};

function saveProses() {
    const form = document.getElementById('proses-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const id = document.getElementById('proses-id').value;
    const item = {
        nomor: document.getElementById('proses-nomor').value,
        nama: document.getElementById('proses-nama').value,
        icon: document.getElementById('proses-icon').value,
        deskripsi: document.getElementById('proses-deskripsi').value
    };
    
    if (id) {
        const index = prosesDataAdmin.findIndex(p => p.id == id);
        if (index !== -1) {
            item.id = parseInt(id);
            prosesDataAdmin[index] = item;
        }
    } else {
        let maxId = 0;
        prosesDataAdmin.forEach(p => { if (p.id > maxId) maxId = p.id; });
        item.id = maxId + 1;
        prosesDataAdmin.push(item);
    }
    
    saveProsesDataToServer();
    const prosesModalEl = document.getElementById('prosesModal');
    prosesModalEl.classList.add('hidden');
    prosesModalEl.classList.remove('flex');
}

function saveProsesDataToServer() {
    fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'proses', payload: prosesDataAdmin })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) renderProsesTable();
        else alert('Gagal menyimpan: ' + data.message);
    });
}

// =========================================
//  GALERI CRUD LOGIC
// =========================================
let galeriDataAdmin = [];
let galeriModalInstance = null;

function loadGaleriData() {
    fetch('../data/galeri.json?t=' + Date.now())
        .then(res => res.json())
        .then(data => {
            galeriDataAdmin = data;
            renderGaleriTable();
        })
        .catch(err => {
            document.getElementById('galeri-table-body').innerHTML = '<tr><td colspan="4" class="text-center text-danger">Gagal memuat data</td></tr>';
        });
}

function renderGaleriTable() {
    const tbody = document.getElementById('galeri-table-body');
    if (!tbody) return;
    
    if (galeriDataAdmin.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-space-lg py-space-xl text-center text-on-surface-variant font-body-sm text-body-sm"><span class="material-symbols-outlined text-[40px] block mb-2 text-outline">photo_library</span>Belum ada foto. Klik "Tambah Foto" untuk mulai.</td></tr>`;
        return;
    }
    
    let html = '';
    galeriDataAdmin.forEach(item => {
        html += `
            <tr class="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                <td class="px-space-lg py-3">
                    <img src="../${item.src}" class="w-20 h-14 object-cover rounded-xl" alt="Preview" onerror="this.src='data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'56\'><rect width=\'80\' height=\'56\' fill=\'%23f0ede9\'/></svg>'">
                </td>
                <td class="px-space-lg py-4 font-body-sm text-body-sm text-on-surface font-semibold">${item.judul}</td>
                <td class="px-space-lg py-4 hidden sm:table-cell">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant">${item.kategori}</span>
                </td>
                <td class="px-space-lg py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button type="button" onclick="openGaleriModal(${item.id})" class="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center" title="Edit">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button type="button" onclick="deleteGaleri(${item.id})" class="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant hover:bg-error-container hover:text-error transition-colors flex items-center justify-center" title="Hapus">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

window.openGaleriModal = function(id = null) {
    const form = document.getElementById('galeri-form');
    form.reset();
    
    if (id) {
        document.getElementById('galeriModalLabel').textContent = 'Edit Foto';
        const item = galeriDataAdmin.find(g => g.id == id);
        if (item) {
            document.getElementById('galeri-id').value = item.id;
            document.getElementById('galeri-judul').value = item.judul || '';
            document.getElementById('galeri-kategori').value = item.kategori || 'Produksi';
            document.getElementById('galeri-src-existing').value = item.src || '';
            document.getElementById('galeri-file-help').textContent = 'Kosongkan jika tidak ingin mengubah foto saat ini.';
        }
    } else {
        document.getElementById('galeriModalLabel').textContent = 'Tambah Foto';
        document.getElementById('galeri-id').value = '';
        document.getElementById('galeri-src-existing').value = '';
        document.getElementById('galeri-file-help').textContent = 'Wajib memilih foto untuk ditambah.';
    }
    
    const modalEl = document.getElementById('galeriModal');
    modalEl.classList.remove('hidden');
    modalEl.classList.add('flex');
};

window.deleteGaleri = function(id) {
    showDeleteModal('galeri', id);
};

function saveGaleri() {
    const form = document.getElementById('galeri-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const fileInput = document.getElementById('galeri-file');
    const id = document.getElementById('galeri-id').value;
    const existingSrc = document.getElementById('galeri-src-existing').value;
    
    if (!id && (!fileInput.files || fileInput.files.length === 0)) {
        alert('Harap pilih foto terlebih dahulu!');
        return;
    }
    
    const btnSave = document.getElementById('btn-save-galeri');
    btnSave.disabled = true;
    btnSave.textContent = 'Menyimpan...';

    // Helper function to proceed with saving to JSON
    const finalizeSave = (imageSrc) => {
        const item = {
            judul: document.getElementById('galeri-judul').value,
            kategori: document.getElementById('galeri-kategori').value,
            src: imageSrc
        };
        
        if (id) {
            const index = galeriDataAdmin.findIndex(g => g.id == id);
            if (index !== -1) {
                item.id = parseInt(id);
                galeriDataAdmin[index] = item;
            }
        } else {
            let maxId = 0;
            galeriDataAdmin.forEach(g => { if (g.id > maxId) maxId = g.id; });
            item.id = maxId + 1;
            galeriDataAdmin.push(item);
        }
        
        saveGaleriDataToServer(() => {
            const galeriModalEl = document.getElementById('galeriModal');
            galeriModalEl.classList.add('hidden');
            galeriModalEl.classList.remove('flex');
            btnSave.disabled = false;
            btnSave.textContent = 'Simpan Foto';
        });
    };

    // If there is a file, upload it first
    if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function () {
            const base64 = String(reader.result).split(',')[1] || '';
            fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    mimeType: file.type,
                    contentBase64: base64
                })
            })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                finalizeSave(data.path);
            } else {
                alert('Gagal upload: ' + data.message);
                btnSave.disabled = false;
                btnSave.textContent = 'Simpan Foto';
            }
        })
            .catch(err => {
                alert('Terjadi kesalahan koneksi saat upload.');
                btnSave.disabled = false;
                btnSave.textContent = 'Simpan Foto';
                console.error(err);
            });
        };
        reader.readAsDataURL(file);
    } else {
        // No new file, use existing
        finalizeSave(existingSrc);
    }
}

function saveGaleriDataToServer(callback) {
    fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'galeri', payload: galeriDataAdmin })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            renderGaleriTable();
            if (callback) callback();
        } else {
            alert('Gagal menyimpan: ' + data.message);
        }
    });
}

