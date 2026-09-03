/* ============================================
   KEMBANG TAHU PANAMBANGAN - MAIN JS (Tailwind)
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  // --- Active nav link based on scroll position ---
  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('#navbar-nav .nav-link');
    let currentSection = '';

    sections.forEach(function (section) {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(function (link) {
      link.classList.remove('text-primary', 'border-primary-container', 'font-bold', 'border-b-2');
      link.classList.add('text-on-surface-variant');
      const href = link.getAttribute('href');
      if (href && href === '#' + currentSection) {
        link.classList.add('text-primary', 'border-primary-container', 'font-bold', 'border-b-2');
        link.classList.remove('text-on-surface-variant');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav);

  // --- Counter Animation ---
  function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(function (counter) {
      if(counter.classList.contains('counted')) return;
      const target = parseInt(counter.getAttribute('data-target'));
      const suffix = counter.getAttribute('data-suffix') || '';
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;

      function updateCounter() {
        current += step;
        if (current < target) {
          counter.textContent = Math.floor(current) + suffix;
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target + suffix;
          counter.classList.add('counted');
        }
      }

      updateCounter();
    });
  }

  // Trigger counters
  const heroSection = document.getElementById('beranda');
  if (heroSection) {
    const counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounters();
        }
      });
    }, { threshold: 0.3 });
    counterObserver.observe(heroSection);
  }

  // =========================================
  //  DATA LOADING & DYNAMIC RENDERING
  // =========================================

  function loadJSON(url) {
    return fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error('Failed to load ' + url);
        return response.json();
      })
      .catch(function (err) {
        console.warn('Could not load ' + url + ':', err.message);
        return null;
      });
  }

  // --- Render Sejarah Singkat ---
  function renderSejarah(data) {
    var title = document.getElementById('sejarah-judul');
    var desc = document.getElementById('sejarah-deskripsi');
    var container = document.getElementById('sejarah-container');
    if (title && data.judul) title.textContent = data.judul;
    if (desc && data.deskripsi) {
      var paragraphs = data.deskripsi.split('\n');
      desc.textContent = paragraphs[0];
      
      if (container) {
        var html = '';
        html += '<div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><span class="material-symbols-outlined text-[28px]">ramen_dining</span></div>';
        html += '<h3 class="font-headline-md text-headline-md text-on-surface">' + data.judul + '</h3>';
        paragraphs.forEach(function(p, i) {
          if (i > 0 && p.trim() !== '') {
             html += '<p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">' + p + '</p>';
          }
        });
        container.innerHTML = html;
      }
    }
  }

  // --- Render Proses Pembuatan ---
  function renderProses(data) {
    var container = document.getElementById('proses-container');
    if (!container || !data) return;

    var html = '';
    data.forEach(function (item, index) {
      html += '<div class="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between border border-outline-variant/40 fade-up" data-delay="' + (index * 100) + '">';
      html += '  <div class="space-y-space-sm">';
      html += '    <div class="flex items-center justify-between">';
      html += '      <span class="w-12 h-12 rounded-full bg-primary/10 text-primary font-headline-sm font-bold flex items-center justify-center border border-primary-container/30">0' + item.nomor + '</span>';
      html += '      <span class="material-symbols-outlined text-primary/60 text-[24px]">verified</span>';
      html += '    </div>';
      html += '    <div>';
      html += '      <h3 class="font-title-md text-title-md text-on-surface font-bold">' + item.nomor + '. ' + item.nama + '</h3>';
      html += '      <p class="font-body-sm text-body-sm text-on-surface-variant mt-space-xs leading-relaxed">' + item.deskripsi + '</p>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    });
    container.innerHTML = html;
    observeNewElements(container);
  }

  // --- Render UMKM Directory ---
  var umkmData = []; 

  function renderUMKM(data) {
    var container = document.getElementById('umkm-container');
    if (!container || !data) return;

    umkmData = data.filter(function (item) { return item.status === 'aktif'; });
    displayUmkm(umkmData);
  }

  function displayUmkm(items) {
    var container = document.getElementById('umkm-container');
    if(!container) return;
    
    var html = '';
    items.forEach(function (item, index) {
      html += '<div class="umkm-card bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-outline-variant/40 flex flex-col justify-between fade-up" style="display:flex;" data-name="' + item.nama.toLowerCase() + ' ' + item.pemilik.toLowerCase() + '" data-block="' + item.lokasi + '" data-delay="' + (index * 50) + '">';
      html += '  <div>';
      html += '    <div class="flex items-center justify-between mb-3">';
      html += '      <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><span class="material-symbols-outlined text-[20px]">storefront</span></div>';
      html += '      <span class="font-label-sm text-label-sm bg-surface-container-low px-2 py-1 rounded text-on-surface-variant">' + item.lokasi + '</span>';
      html += '    </div>';
      html += '    <h4 class="font-title-md text-title-md text-on-surface font-bold">' + item.nama + '</h4>';
      html += '    <p class="font-label-md text-label-md text-primary mt-1">Pemilik: ' + item.pemilik + '</p>';
      html += '  </div>';
      html += '  <button class="mt-4 w-full py-2 bg-surface-container-low hover:bg-primary-container text-on-surface hover:text-on-primary-container rounded-lg font-label-md text-label-md transition-colors" onclick="openModal(' + item.id + ')">Lihat Detail</button>';
      html += '</div>';
    });
    container.innerHTML = html;
    observeNewElements(container);
  }

  window.filterUmkm = function() {
    var searchInput = document.getElementById('umkm-search');
    var search = searchInput ? searchInput.value.toLowerCase() : '';
    var block = window.currentBlockFilter || 'all';
    
    var filtered = umkmData.filter(function(item) {
       var matchSearch = item.nama.toLowerCase().includes(search) || item.pemilik.toLowerCase().includes(search);
       var matchBlock = block === 'all' || item.lokasi === block;
       return matchSearch && matchBlock;
    });
    displayUmkm(filtered);
  }

  window.showUMKMDetail = function(id) {
    var item = umkmData.find(function (u) { return u.id === id; });
    if (!item) return;

    document.getElementById('modal-title').textContent = item.nama;
    document.getElementById('modal-owner').textContent = 'Pemilik: ' + item.pemilik;
    document.getElementById('modal-address').textContent = item.lokasi;
    document.getElementById('modal-description').textContent = item.deskripsi + ' (Produk: ' + item.produk + ')';

    var waLink = document.getElementById('modal-wa-link');
    if (waLink && item.whatsapp) {
      var cleanWa = item.whatsapp.replace(/[^0-9]/g, '');
      waLink.href = 'https://wa.me/' + cleanWa + '?text=' + encodeURIComponent('Halo, saya ingin bertanya tentang Kembang Tahu dari ' + item.nama);
    }
  }

  // --- Render Gallery ---
  var galeriData = [];
  window.currentGalleryFilter = 'Semua';

  function renderGaleri(data) {
    galeriData = data;
    window.applyGalleryFilter();
  }

  window.applyGalleryFilter = function() {
    var filter = window.currentGalleryFilter || 'Semua';
    var filtered = filter === 'Semua' ? galeriData : galeriData.filter(function(item) { return item.kategori === filter; });
    
    var container = document.getElementById('galeri-container');
    if(!container) return;
    
    var html = '';
    filtered.forEach(function (item, index) {
      html += '<div class="gallery-item relative group overflow-hidden rounded-2xl aspect-[4/3] bg-surface-container-high shadow-sm cursor-pointer fade-up" data-delay="' + (index * 50) + '" onclick="openLightbox(\'' + item.src + '\', \'' + item.judul + '\')">';
      html += '  <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" src="' + item.src + '" alt="' + item.judul + '">';
      html += '  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-space-md text-white">';
      html += '    <span class="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider">' + item.kategori + '</span>';
      html += '    <h4 class="font-title-md text-title-md font-bold">' + item.judul + '</h4>';
      html += '  </div>';
      html += '</div>';
    });
    container.innerHTML = html;
    observeNewElements(container);
  }

  // --- Scroll Animations ---
  function observeNewElements(container) {
    var animatedElements = container.querySelectorAll('.fade-up, .fade-left, .fade-right');
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var delay = entry.target.getAttribute('data-delay');
            if (delay) {
              entry.target.style.transitionDelay = delay + 'ms';
            }
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      animatedElements.forEach(function (el) { observer.observe(el); });
    } else {
      animatedElements.forEach(function (el) { el.classList.add('visible'); });
    }
  }

  var staticAnimatedElements = document.querySelectorAll('.fade-up, .fade-left, .fade-right');
  if ('IntersectionObserver' in window) {
    var staticObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var delay = entry.target.getAttribute('data-delay');
          if (delay) {
            entry.target.style.transitionDelay = delay + 'ms';
          }
          entry.target.classList.add('visible');
          staticObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    staticAnimatedElements.forEach(function (el) { staticObserver.observe(el); });
  } else {
    staticAnimatedElements.forEach(function (el) { el.classList.add('visible'); });
  }

  // =========================================
  //  LOAD ALL DATA & RENDER
  // =========================================

  Promise.all([
    loadJSON('data/sejarah.json'),
    loadJSON('data/proses.json'),
    loadJSON('data/umkm.json'),
    loadJSON('data/galeri.json')
  ]).then(function (results) {
    var sejarahData = results[0];
    var prosesData = results[1];
    var umkmJsonData = results[2];
    var galeriJsonData = results[3];

    if (sejarahData) renderSejarah(sejarahData);
    if (prosesData) renderProses(prosesData);
    if (umkmJsonData) renderUMKM(umkmJsonData);
    if (galeriJsonData) renderGaleri(galeriJsonData);
  });

  updateActiveNav();
});
