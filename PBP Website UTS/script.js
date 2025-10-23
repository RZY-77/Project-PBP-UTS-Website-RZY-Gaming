/* Client-side app for RZY Gaming (simulated transaction flow) */
document.addEventListener('DOMContentLoaded', () => {
  try {
    const currency = new Intl.NumberFormat('id-ID');

    // Toast helper - defensive; fallback to alert if bootstrap/toast not available
    function showToast(title, body, delay = 3000) {
      const container = document.querySelector('.toast-container');
      if (!container || typeof bootstrap === 'undefined' || typeof bootstrap.Toast === 'undefined') {
        // fallback
        try { alert((title ? title + ': ' : '') + body); } catch (e) { console.log(title, body); }
        return;
      }
      const toastEl = document.createElement('div');
      toastEl.className = 'toast align-items-center text-bg-dark border-0';
      toastEl.setAttribute('role','alert');
      toastEl.setAttribute('aria-live','assertive');
      toastEl.setAttribute('aria-atomic','true');
      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body"> <strong>${title}</strong><div>${body}</div></div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>`;
      container.appendChild(toastEl);
      const bsToast = new bootstrap.Toast(toastEl, {delay});
      bsToast.show();
      toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    }

    // Utility to read query params (prefill game)
    function getQueryParams() {
      try { return Object.fromEntries(new URLSearchParams(location.search)); } catch (e) { return {}; }
    }

    // Update year placeholders
    document.querySelectorAll('#year, #year2, #year3').forEach(el => { if (el) el.textContent = new Date().getFullYear(); });

    // --- Transaction page logic (all guarded by existence checks) ---
  const form = document.getElementById('transaksiForm');
    const gameSelect = document.getElementById('gameSelect');
    const playerId = document.getElementById('playerId');
    const nominal = document.getElementById('nominal');
    const payment = document.getElementById('payment');

    const sGame = document.getElementById('summaryGame');
    const sId = document.getElementById('summaryId');
    const sNominal = document.getElementById('summaryNominal');
    const sPayment = document.getElementById('summaryPayment');
    const sTotal = document.getElementById('summaryTotal');

    // Prefill from query string
    const params = getQueryParams();
    if (params.game && gameSelect) {
      for (const opt of gameSelect.options) { if (opt.value === params.game) { opt.selected = true; break; } }
    }

    // --- Game preview handling ---
    const gameImageMap = {
      'Mobile Legends': 'Gambar Icon/Mobile Legend Icon.png',
      'Genshin Impact': 'Gambar Icon/Genshin Impact Icon.png',
      'PUBG Mobile': 'Gambar Icon/PUBG Mobile Icon.png',
      'Free Fire': 'Gambar Icon/Free Fire Icon.png',
      'Honkai Star Rail': 'Gambar Icon/HSR Icon.png',
      'Honor of Kings': 'Gambar Icon/honor of kings icon.png',
      'Magic Chess Go Go': 'Gambar Icon/magic chess icon.png',
      'Zenless Zone Zero': 'Gambar Icon/ZZZ Icon.png'
    };

    // currency mapping: game -> {icon, unitName}
    const currencyMap = {
      'Mobile Legends': { icon: 'Gambar Currency/Diamond.png', unit: 'Diamond' },
      'Magic Chess Go Go': { icon: 'Gambar Currency/Diamond.png', unit: 'Diamond' },
      'Free Fire': { icon: 'Gambar Currency/Diamond.png', unit: 'Diamond' },
      'Zenless Zone Zero': { icon: 'Gambar Currency/Monochrome.png', unit: 'Monochrome' },
      'Honkai Star Rail': { icon: 'Gambar Currency/Stellar Jade.png', unit: 'Stellar Jade' },
      'Genshin Impact': { icon: 'Gambar Currency/Genesis Crystal.png', unit: 'Genesis Crystal' },
      'PUBG Mobile': { icon: 'Gambar Currency/UC Coin.png', unit: 'UC Coin' },
      'Honor of Kings': { icon: 'Gambar Currency/Token.png', unit: 'Token' }
    };

    // unit counts per nominal
    const unitTable = {
      10000: 58,
      20000: 116,
      50000: 290,
      100000: 900
    };

    function populateNominalOptions(selectEl, game) {
      try {
        if (!selectEl) return;
        // keep numeric values, but update displayed text
        const opts = [10000, 20000, 50000, 100000];
        // clear existing (except placeholder)
        selectEl.innerHTML = '<option value="">-- Pilih Nominal --</option>';
        const cur = currencyMap[game];
        for (const v of opts) {
          const units = unitTable[v] || 0;
          const text = cur ? `${formatNumber(v)} — ${units} ${cur.unit}` : `${formatNumber(v)}`;
          const o = document.createElement('option');
          o.value = String(v);
          o.textContent = text;
          selectEl.appendChild(o);
        }
        // update currency preview next to select
        const preview = (selectEl.closest('.modal') || document).querySelector('#currencyPreview');
        const iconEl = preview ? preview.querySelector('#currencyIcon') : null;
        const infoEl = preview ? preview.querySelector('#currencyInfo') : null;
        if (cur && iconEl && infoEl) {
          iconEl.src = cur.icon; iconEl.style.display = 'inline-block';
          infoEl.textContent = `${unitTable[selectEl.value || 10000] || unitTable[10000]} ${cur.unit}`;
        } else if (preview && infoEl) {
          if (iconEl) iconEl.style.display = 'none';
          infoEl.textContent = '';
        }
      } catch (e) { console.warn('populateNominalOptions', e); }
    }

    // helper: format number for display (10.000)
    function formatNumber(n) { return new Intl.NumberFormat('id-ID').format(n); }

    // when nominal select changes, update currencyInfo
    function attachNominalHandler(selectEl) {
      if (!selectEl) return;
      selectEl.addEventListener('change', () => {
        const preview = (selectEl.closest('.modal') || document).querySelector('#currencyPreview');
        const infoEl = preview ? preview.querySelector('#currencyInfo') : null;
        const gameEl = (selectEl.closest('.modal') || document).querySelector('#gameSelect') || gameSelect;
        const cur = gameEl ? currencyMap[gameEl.value] : null;
        if (cur && infoEl) {
          const units = unitTable[Number(selectEl.value) || 10000];
          infoEl.textContent = units ? `${units} ${cur.unit}` : '';
        }
      });
    }

    // attach nominal handler for the page-level nominal select(s)
    document.querySelectorAll('#nominal').forEach(nSel => attachNominalHandler(nSel));

    function updateGamePreview(selectEl) {
      try {
        if (!selectEl) return;
        const val = selectEl.value || '';
        // find preview image element in the same form/modal
        const preview = (selectEl.closest('.modal') || document).querySelector('#gamePreview');
        if (!preview) return;
        const src = gameImageMap[val] || '';
        if (src) { preview.src = src; preview.style.display = 'inline-block'; }
        else { preview.src = ''; preview.style.display = 'none'; }
      } catch (e) { console.warn('Preview update error', e); }
    }

    // attach preview update to current gameSelect on this page
    if (gameSelect) {
      gameSelect.addEventListener('change', () => {
        updateGamePreview(gameSelect);
        // populate nominal for this page form
        const nom = document.getElementById('nominal');
        populateNominalOptions(nom, gameSelect.value);
        updateSummary();
      });
      // initial preview/populate if already selected
      updateGamePreview(gameSelect);
      populateNominalOptions(document.getElementById('nominal'), gameSelect.value);
    }

    // Open-topup buttons (index/all) -> open modal and prefill game
    document.querySelectorAll('.open-topup').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const g = btn.dataset.game || '';
        // find modal form elements (may be duplicate per page)
        const modalEl = document.getElementById('formModal');
        if (!modalEl) { showToast('Error', 'Form modal tidak ditemukan.'); return; }
        // set selected value in any gameSelect inside modal
        const modalSelect = modalEl.querySelector('#gameSelect');
        if (modalSelect && g) {
          for (const opt of modalSelect.options) { if (opt.value === g) { opt.selected = true; break; } }
          // update preview inside modal
          updateGamePreview(modalSelect);
          // populate nominal options inside this modal for the selected game
          const modalNom = modalEl.querySelector('#nominal');
          populateNominalOptions(modalNom, g);
          // attach change handler to the modal nominal if not already attached
          attachNominalHandler(modalNom);
        }
        // show modal
        try { const bs = new bootstrap.Modal(modalEl); bs.show(); } catch (err) { showToast('Info', 'Silakan buka halaman Transaksi untuk melanjutkan.'); }
      });
    });

    function updateSummary() {
      try {
        const g = gameSelect ? gameSelect.value : '';
        const id = playerId ? playerId.value.trim() : '';
        const n = nominal ? Number(nominal.value || 0) : 0;
        const p = payment ? payment.value : '';
        sGame && (sGame.textContent = g || '-');
        sId && (sId.textContent = id || '-');
        sNominal && (sNominal.textContent = n ? 'Rp ' + currency.format(n) : '-');
        sPayment && (sPayment.textContent = p || '-');
        const total = n ? Math.round(n * 1.05) : 0;
        sTotal && (sTotal.textContent = total ? 'Rp ' + currency.format(total) : '-');
      } catch (e) { /* ignore update errors */ }
    }

    gameSelect && gameSelect.addEventListener('change', updateSummary);
    playerId && playerId.addEventListener('input', updateSummary);
    nominal && nominal.addEventListener('change', updateSummary);
    payment && payment.addEventListener('change', updateSummary);
    updateSummary();

    // Modal & submit
    const confirmModalEl = document.getElementById('confirmModal');
    let confirmModal = null;
    if (confirmModalEl && typeof bootstrap !== 'undefined' && typeof bootstrap.Modal !== 'undefined') confirmModal = new bootstrap.Modal(confirmModalEl);
    const confirmText = document.getElementById('confirmText');
    const confirmProceed = document.getElementById('confirmProceed');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
          const g = gameSelect ? gameSelect.value : '';
          const id = playerId ? playerId.value.trim() : '';
          const n = nominal ? Number(nominal.value || 0) : 0;
          const p = payment ? payment.value : '';
          if (!g || !id || !n || !p) { showToast('Gagal', 'Harap lengkapi semua data transaksi.'); return; }

          const total = Math.round(n * 1.05);
          const text = `Game: ${g}\nID Player: ${id}\nNominal: Rp ${currency.format(n)}\nMetode: ${p}\nTotal (+5% admin): Rp ${currency.format(total)}`;
          if (confirmText) confirmText.textContent = text;
          if (confirmModal) confirmModal.show(); else showToast('Konfirmasi', text);
        } catch (err) { console.error(err); showToast('Error', 'Terjadi kesalahan pada form.'); }
      });
    }

    // handle confirm proceed
    if (confirmProceed) {
      confirmProceed.addEventListener('click', () => {
        try {
          if (confirmModal) confirmModal.hide();
          showToast('Sukses', 'Transaksi berhasil diproses. Mohon tunggu konfirmasi admin.', 4000);
          form && form.reset();
          updateSummary();
        } catch (err) { console.error(err); }
      });
    }

    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
          const name = (document.getElementById('name') || {}).value?.trim() || '';
          const email = (document.getElementById('email') || {}).value?.trim() || '';
          const message = (document.getElementById('message') || {}).value?.trim() || '';
          const emailOK = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
          if (!name || !email || !message) { showToast('Gagal', 'Harap isi semua kolom.'); return; }
          if (!emailOK) { showToast('Gagal', 'Email tidak valid.'); return; }
          showToast('Terima kasih', `Pesan Anda telah dikirim, ${name}. Kami akan menghubungi via ${email}`);
          contactForm.reset();
        } catch (err) { console.error(err); showToast('Error', 'Terjadi kesalahan saat mengirim pesan.'); }
      });
    }

  } catch (e) {
    console.error('Initialization error in script.js', e);
  }

});
