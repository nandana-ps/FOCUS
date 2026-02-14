import { supabase, USER_ID } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');

    // Always show dashboard
    showDashboard();

    async function showDashboard() {
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');

        // Fetch Profile
        let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', USER_ID)
            .single();

        // Update UI
        const normalLimit = profile?.settings?.normal_limit || 60;
        document.getElementById('user-name').textContent = profile?.full_name || "Focus Master";
        document.getElementById('mode-badge').textContent = "ONLINE";

        // Fetch Usage
        const today = new Date().toISOString().split('T')[0];
        const { data: usage } = await supabase
            .from('usage_logs')
            .select('*')
            .eq('user_id', USER_ID)
            .eq('date', today)
            .single();

        renderUsage(usage || { youtube_mins: 0, instagram_mins: 0 }, normalLimit);
    }

    function renderUsage(usage, limit) {
        const list = document.getElementById('usage-list');
        list.innerHTML = '';

        const sites = [
            { name: 'YouTube', used: usage.youtube_mins || 0, limit: limit },
            { name: 'Instagram', used: usage.instagram_mins || 0, limit: limit }
        ];

        sites.forEach(site => {
            const percent = Math.min(100, (site.used / site.limit) * 100);
            const item = document.createElement('div');
            item.className = 'usage-item';
            item.innerHTML = `
                <div class="site-info">
                    <div class="site-header">
                        <span>${site.name}</span>
                        <span>${site.used}m / ${site.limit}m</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
            list.appendChild(item);
        });
    }
});
