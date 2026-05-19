// api.js - Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbzkpqO0CgNZpdmuerQhvCP3iecTisH_OcjsLDbtT_7lQCQGgD9mO_1tcxhbLVbBNjIi/exec';

const ApiService = {
    async sendData(payload) {
        const formData = new URLSearchParams();
        Object.keys(payload).forEach(key => formData.append(key, payload[key]));

        if (!navigator.onLine) {
            this.saveOffline(payload);
            return { status: 'offline' };
        }

        try {
            const response = await fetch(scriptURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });

            if (!response.ok) throw new Error('Kết nối API thất bại');
            
            const result = await response.json();
            if (result.status === 'success') {
                this.syncOfflineData();
                return { status: 'success' };
            } else {
                throw new Error(result.message || 'Lỗi Apps Script xử lý dữ liệu');
            }
        } catch (error) {
            console.error('Đứt kết nối mạng, chuyển lưu hàng đợi cục bộ:', error);
            this.saveOffline(payload);
            return { status: 'cached' };
        }
    },

    saveOffline(payload) {
        let queue = JSON.parse(localStorage.getItem('hcc_offline_queue')) || [];
        queue.push({ ...payload, timestamp_offline: new Date().toISOString() });
        localStorage.setItem('hcc_offline_queue', JSON.stringify(queue));
    },

    async syncOfflineData() {
        let queue = JSON.parse(localStorage.getItem('hcc_offline_queue')) || [];
        if (queue.length === 0) return;

        let failedItems = [];
        for (const item of queue) {
            try {
                const formData = new URLSearchParams();
                Object.keys(item).forEach(k => formData.append(k, item[k]));

                await fetch(scriptURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString()
                });
            } catch (err) {
                failedItems.push(item);
            }
        }

        if (failedItems.length === 0) {
            localStorage.removeItem('hcc_offline_queue');
        } else {
            localStorage.setItem('hcc_offline_queue', JSON.stringify(failedItems));
        }
    }
};

window.addEventListener('online', () => ApiService.syncOfflineData());