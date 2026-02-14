const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qzpgigcwgudmijtrzmrl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Tdv8n-7UhNbjuo-71kxM_Q_c3mbcIK4';
const USER_ID = '00000000-0000-0000-0000-000000000001';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const fs = require('fs');

async function test() {
    let log = '';
    const l = (msg) => { log += msg + '\n'; console.log(msg); };

    l('=== Supabase Connection Test ===');
    l('URL: ' + SUPABASE_URL);
    l('Key starts with: ' + SUPABASE_ANON_KEY.substring(0, 30));
    l('');

    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', USER_ID).single();
        l('Profile data: ' + JSON.stringify(data));
        l('Profile error: ' + JSON.stringify(error));
    } catch (e) {
        l('CATCH error: ' + e.message);
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('usage_logs').select('*').eq('user_id', USER_ID).eq('date', today);
        l('Usage data: ' + JSON.stringify(data));
        l('Usage error: ' + JSON.stringify(error));
    } catch (e) {
        l('CATCH error: ' + e.message);
    }

    fs.writeFileSync('test_results.txt', log);
    l('\nResults saved to test_results.txt');
}

test();
