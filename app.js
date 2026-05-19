// app.js - Điều khiển giao diện & Điều hướng luồng SPA nội bộ
let currentSessionData = {};

const normalize = (str) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim() : '';
const debounce = (func, delay) => {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
};

document.addEventListener('DOMContentLoaded', () => {
    const agentScreen = document.getElementById('agent-screen');
    const citizenScreen = document.getElementById('citizen-screen');
    const thankyouScreen = document.getElementById('thankyou-screen');
    const agentForm = document.getElementById('agent-form');
    
    initModalLogic();
    initFormLogic();
    initEvaluationLogic(agentScreen, citizenScreen, thankyouScreen, agentForm);
    
    agentScreen.classList.add('fade-enter-active');
});

function switchScreen(hideEl, showEl) {
    hideEl.classList.remove('fade-enter-active');
    hideEl.classList.add('fade-exit-active');
    setTimeout(() => {
        hideEl.classList.add('hidden');
        hideEl.classList.remove('fade-exit-active');
        
        showEl.classList.remove('hidden');
        showEl.classList.add('fade-enter');
        void showEl.offsetWidth;
        showEl.classList.add('fade-enter-active');
        showEl.classList.remove('fade-enter');
    }, 300);
}

function initModalLogic() {
    const modal = document.getElementById('modalConfig');
    const modalInner = modal.querySelector('div');
    const parentSelect = document.getElementById('parentUnit');
    const searchStore = document.getElementById('searchCuaHang');
    const suggestStore = document.getElementById('suggestCuaHang');
    const btnSave = document.getElementById('btnSaveConfig');
    const txtUnit = document.getElementById('txtCurrentUnit');
    const statusDot = document.getElementById('statusIndicator');

    if (typeof DS_DON_VI !== 'undefined') {
        Object.keys(DS_DON_VI).forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = key.toUpperCase();
            parentSelect.appendChild(opt);
        });
    }

    const savedStore = localStorage.getItem('hcc_store');
    const savedParent = localStorage.getItem('hcc_parent');

    const openModal = () => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modalInner.classList.remove('scale-95'), 10);
    };

    const closeModal = () => {
        modalInner.classList.add('scale-95');
        setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 300);
    };

    if (savedStore && savedParent) {
        txtUnit.textContent = savedStore;
        statusDot.className = "w-2.5 h-2.5 rounded-full bg-green-500";
        document.getElementById('btnCloseModal').classList.remove('hidden');
        document.getElementById('btnCancelConfig').classList.remove('hidden');
    } else {
        openModal();
    }

    document.getElementById('btnOpenConfig').addEventListener('click', openModal);
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnCancelConfig').addEventListener('click', closeModal);

    parentSelect.addEventListener('change', function() {
        searchStore.value = '';
        suggestStore.innerHTML = '';
        btnSave.disabled = true;
        btnSave.className = "px-6 py-3 text-white bg-gray-300 font-bold rounded-2xl cursor-not-allowed transition border-none";
        searchStore.disabled = !this.value;
        searchStore.className = `w-full pl-11 pr-4 py-3.5 rounded-2xl ${this.value ? 'bg-white' : 'bg-gray-100'} border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-gray-700 font-medium`;
    });

    searchStore.addEventListener('input', debounce(function() {
        const val = this.value;
        const parent = parentSelect.value;
        suggestStore.innerHTML = '';
        
        if (!val || !DS_DON_VI[parent]) { suggestStore.classList.add('hidden'); return; }
        
        const matches = DS_DON_VI[parent].filter(i => normalize(i).includes(normalize(val)));
        if (matches.length) {
            suggestStore.classList.remove('hidden');
            matches.forEach(item => {
                const div = document.createElement('div');
                div.className = "p-4 hover:bg-brand-50 cursor-pointer text-sm font-semibold text-gray-700 border-b border-gray-100 transition-colors";
                div.textContent = item;
                div.onclick = () => {
                    searchStore.value = item;
                    suggestStore.classList.add('hidden');
                    btnSave.disabled = false;
                    btnSave.className = "px-6 py-3 text-white bg-brand-600 hover:bg-brand-800 font-bold rounded-2xl transition shadow-md cursor-pointer border-none";
                };
                suggestStore.appendChild(div);
            });
        } else { suggestStore.classList.add('hidden'); }
    }, 200));

    btnSave.addEventListener('click', () => {
        localStorage.setItem('hcc_parent', parentSelect.value);
        localStorage.setItem('hcc_store', searchStore.value);
        txtUnit.textContent = searchStore.value;
        statusDot.className = "w-2.5 h-2.5 rounded-full bg-green-500";
        document.getElementById('btnCloseModal').classList.remove('hidden');
        document.getElementById('btnCancelConfig').classList.remove('hidden');
        closeModal();
    });
}

function initFormLogic() {
    const selectLinhVuc = document.getElementById('linhVuc');
    const searchTTHC = document.getElementById('searchTTHC');
    const suggestTTHC = document.getElementById('suggestTTHC');
    const radiosTrangThai = document.querySelectorAll('input[name="trangThaiRadio"]');
    const inputMaHoSo = document.getElementById('maHoSo');
    const inputLyDo = document.getElementById('lyDo');

    // 1. Nạp sẵn dữ liệu lĩnh vực vào Select và Khóa cứng ngay từ đầu
    if (typeof DANH_MUC_TTHC !== 'undefined') {
        Object.keys(DANH_MUC_TTHC).forEach(key => {
            const opt = document.createElement('option');
            opt.value = key; opt.textContent = key;
            selectLinhVuc.appendChild(opt);
        });
    }
    selectLinhVuc.disabled = true; // Khóa Lĩnh vực
    selectLinhVuc.classList.add('bg-gray-100', 'cursor-not-allowed'); // CSS khóa

    // 2. Logic Tìm kiếm TTHC & Auto-map Lĩnh vực
    searchTTHC.disabled = false; // Đảm bảo TTHC luôn mở
    searchTTHC.addEventListener('input', debounce(function() {
        const val = this.value;
        suggestTTHC.innerHTML = '';
        if (!val) { suggestTTHC.classList.add('hidden'); return; }

        let matches = [];
        // Quét toàn bộ danh mục để tìm TTHC
        Object.entries(DANH_MUC_TTHC).forEach(([linhVuc, list]) => {
            const filtered = list.filter(item => normalize(item).includes(normalize(val)));
            filtered.forEach(item => matches.push({ name: item, category: linhVuc }));
        });

        if (matches.length) {
            suggestTTHC.classList.remove('hidden');
            matches.forEach(match => {
                const div = document.createElement('div');
                div.className = "p-4 hover:bg-brand-50 cursor-pointer text-sm font-semibold text-gray-700 border-b border-gray-100";
                div.innerHTML = `<span class="block text-xs text-brand-600 font-bold">${match.category}</span>${match.name}`;
                div.onclick = () => {
                    searchTTHC.value = match.name; // Điền tên TTHC
                    selectLinhVuc.value = match.category; // Auto-map Lĩnh vực
                    suggestTTHC.classList.add('hidden');
                };
                suggestTTHC.appendChild(div);
            });
        } else { suggestTTHC.classList.add('hidden'); }
    }, 200));

    // 3. Logic radio trạng thái (giữ nguyên để điều khiển Hồ sơ/Lý do)
    radiosTrangThai.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'Thành công') {
                inputMaHoSo.disabled = false; inputMaHoSo.required = true;
                inputMaHoSo.className = "w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border-none ring-1 ring-brand-300 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-gray-800 font-bold";
                inputLyDo.disabled = true; inputLyDo.required = false; inputLyDo.value = '';
                inputLyDo.className = "w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-100 border-none ring-1 ring-gray-200 outline-none transition-all text-gray-400 font-medium disabled:opacity-60 disabled:cursor-not-allowed";
            } else {
                inputMaHoSo.disabled = true; inputMaHoSo.required = false; inputMaHoSo.value = '';
                inputLyDo.disabled = false; inputLyDo.required = true;
                inputLyDo.className = "w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border-none ring-1 ring-orange-300 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-gray-800 font-medium";
            }
        });
    });
}

function initEvaluationLogic(agentScreen, citizenScreen, thankyouScreen, agentForm) {
    const emojiBtns = document.querySelectorAll('.emoji-btn');
    const submitBtn = document.getElementById('submit-rating-btn');
    const feedbackBox = document.getElementById('feedback-container');
    const txtGopY = document.getElementById('gopY');
    let selectedRating = null;

    const resetCitizen = () => {
        selectedRating = null;
        emojiBtns.forEach(b => b.classList.remove('selected'));
        feedbackBox.classList.add('hidden', 'opacity-0');
        txtGopY.value = '';
        submitBtn.disabled = true;
        submitBtn.className = "bg-gray-300 text-gray-500 font-bold text-xl py-4 px-12 rounded-full cursor-not-allowed transition-all duration-300 mx-auto block w-full max-w-sm border-none";
        submitBtn.textContent = "Gửi Đánh Giá";
    };

    agentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if(!document.getElementById('searchTTHC').value) { alert("Vui lòng chọn một thủ tục hành chính hợp lệ từ danh sách!"); return; }
        
        // Trích xuất giá trị radio đang được tick
        const selectedTrangThai = document.querySelector('input[name="trangThaiRadio"]:checked');
        
        currentSessionData = {
            donVi: localStorage.getItem('hcc_parent') || '',
            cuaHang: localStorage.getItem('hcc_store') || '',
            tenNhanVien: document.getElementById('tenNhanVien').value,
            tenKhachHang: document.getElementById('tenKhachHang').value || 'Không cung cấp',
            linhVuc: document.getElementById('linhVuc').value,
            tenTTHC: document.getElementById('searchTTHC').value,
            trangThai: selectedTrangThai ? selectedTrangThai.value : '',
            maHoSo: document.getElementById('maHoSo').value || '',
            lyDo: document.getElementById('lyDo').value || ''
        };

        resetCitizen();
        switchScreen(agentScreen, citizenScreen);
    });

    document.getElementById('back-to-agent').addEventListener('click', () => switchScreen(citizenScreen, agentScreen));

    emojiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            emojiBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedRating = btn.getAttribute('data-rating');

            feedbackBox.classList.remove('hidden');
            setTimeout(() => feedbackBox.classList.remove('opacity-0'), 50);

            submitBtn.disabled = false;
            submitBtn.className = "bg-brand-600 text-white hover:bg-brand-800 font-bold text-xl py-4 px-12 rounded-full shadow-lg shadow-brand-500/40 transform hover:-translate-y-1 transition-all duration-300 mx-auto block w-full max-w-sm active:scale-95 border-none cursor-pointer";
        });
    });

    submitBtn.addEventListener('click', () => {
        if(!selectedRating) return;
        submitBtn.disabled = true;
        submitBtn.textContent = "Đang xử lý...";

        currentSessionData.danhGia = selectedRating;
        currentSessionData.gopY = txtGopY.value;
        ApiService.sendData(currentSessionData);

        switchScreen(citizenScreen, thankyouScreen);
        
        const progressBar = document.getElementById('progress-bar');
        const countdownEl = document.getElementById('countdown');
        let timeLeft = 3;
        
        progressBar.style.width = '0%';
        setTimeout(() => {
            progressBar.style.width = '100%';
            progressBar.style.transitionDuration = '3000ms';
        }, 50);

        const timer = setInterval(() => {
            timeLeft--;
            countdownEl.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timer);
                
                // Khôi phục form nhân viên về trạng thái bị khóa mặc định
                agentForm.reset();
                
                const searchTTHC = document.getElementById('searchTTHC');
                searchTTHC.disabled = true;
                searchTTHC.className = "w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-100 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-gray-700 font-medium disabled:opacity-60 disabled:cursor-not-allowed";
                
                const inputMaHoSo = document.getElementById('maHoSo');
                inputMaHoSo.disabled = true;
                inputMaHoSo.className = "w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-100 border-none ring-1 ring-gray-200 outline-none transition-all text-gray-400 font-bold disabled:opacity-60 disabled:cursor-not-allowed";
                
                const inputLyDo = document.getElementById('lyDo');
                inputLyDo.disabled = true;
                inputLyDo.className = "w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-100 border-none ring-1 ring-gray-200 outline-none transition-all text-gray-400 font-medium disabled:opacity-60 disabled:cursor-not-allowed";

                switchScreen(thankyouScreen, agentScreen);
            }
        }, 1000);
    });
}