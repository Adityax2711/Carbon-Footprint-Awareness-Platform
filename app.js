
var EF = {
    transport: { car_petrol: 0.21, car_diesel: 0.17, car_electric: 0.05, motorbike: 0.11, bus: 0.089, train: 0.041, flight_short: 0.255, flight_long: 0.195, bike: 0 },
    energy: { electricity: 0.233, natural_gas: 2.04, heating_oil: 2.52, solar: 0 },
    diet: { beef: 6.0, lamb: 5.5, pork: 2.9, chicken: 1.1, fish: 1.3, dairy: 2.1, eggs: 0.8, vegetarian: 0.5, vegan: 0.3 },
    shopping: { clothing: 10, shoes: 14, smartphone: 70, laptop: 300, tv: 200, appliance: 400, book: 1.0, groceries: 3.5, online_order: 4.5 }
};

var DEFAULT = {
    user: { name: 'EcoUser', location: 'global', lifestyle: 'average', goal: 500 },
    activities: [],
    doneTips: [],
    badges: [],
    challenges: [],
    streak: { cur: 0, best: 0, lastDate: null },
    quizScore: 0
};

function loadState() {
    try { var r = localStorage.getItem('ecotrack'); return r ? JSON.parse(r) : null; }
    catch (e) { return null; }
}
function save() {
    try { localStorage.setItem('ecotrack', JSON.stringify(S)); } catch (e) { }
}

var S = loadState() || JSON.parse(JSON.stringify(DEFAULT));
if (!S.doneTips) S.doneTips = [];
if (!S.badges) S.badges = [];
if (!S.challenges) S.challenges = [];
if (!S.quizScore) S.quizScore = 0;
if (!S.streak) S.streak = { cur: 0, best: 0, lastDate: null };

if (S.activities.length === 0) {
    var td = new Date();
    for (var d = 59; d >= 0; d--) {
        var dt = new Date(td); dt.setDate(dt.getDate() - d);
        var ds = dt.toISOString().split('T')[0];
        var num = 1 + Math.floor(Math.random() * 3);
        for (var k = 0; k < num; k++) {
            var cats = ['transport', 'energy', 'diet'];
            var cat = cats[Math.floor(Math.random() * cats.length)];
            var type, val, co2;
            if (cat === 'transport') {
                var tt = ['car_petrol', 'bus', 'train', 'bike'];
                type = tt[Math.floor(Math.random() * tt.length)];
                val = 5 + Math.floor(Math.random() * 45);
                co2 = parseFloat((val * EF.transport[type]).toFixed(2));
            } else if (cat === 'energy') {
                type = 'electricity'; val = 5 + Math.floor(Math.random() * 18);
                co2 = parseFloat((val * EF.energy[type]).toFixed(2));
            } else {
                var dt2 = ['beef', 'chicken', 'vegetarian', 'vegan', 'eggs'];
                type = dt2[Math.floor(Math.random() * dt2.length)];
                val = 1 + Math.floor(Math.random() * 2);
                co2 = parseFloat((val * EF.diet[type]).toFixed(2));
            }
            S.activities.push({ id: 's' + d + k, date: ds, category: cat, type: type, val: val, co2: co2 });
        }
    }
    S.streak = { cur: 9, best: 14, lastDate: new Date().toISOString().split('T')[0] };
    save();
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function todayStr() { return new Date().toISOString().split('T')[0]; }
function monthPfx(offset) {
    offset = offset || 0;
    var d = new Date(); d.setMonth(d.getMonth() - offset);
    return d.toISOString().slice(0, 7);
}
function fmtDate(ds) {
    var d = new Date(ds + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function daysAgo(ds) {
    var diff = Math.floor((new Date() - new Date(ds + 'T00:00:00')) / 86400000);
    if (diff === 0) return 'Today'; if (diff === 1) return 'Yesterday'; return diff + 'd ago';
}
function monthCO2(offset) {
    offset = offset || 0;
    var mk = monthPfx(offset);
    return S.activities.filter(function (a) { return a.date.indexOf(mk) === 0; }).reduce(function (s, a) { return s + a.co2; }, 0);
}
function catBreak(offset) {
    offset = offset || 0;
    var mk = monthPfx(offset), r = { transport: 0, energy: 0, diet: 0, shopping: 0 };
    S.activities.filter(function (a) { return a.date.indexOf(mk) === 0; }).forEach(function (a) { r[a.category] = (r[a.category] || 0) + a.co2; });
    return r;
}
function showToast(msg, ico) {
    ico = ico || '✅';
    var t = document.getElementById('toast');
    document.getElementById('t-msg').textContent = msg;
    document.getElementById('t-ico').textContent = ico;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove('show'); }, 3200);
}
function counter(id, to, sfx) {
    sfx = sfx || '';
    var el = document.getElementById(id); if (!el) return;
    var n = parseFloat(to), dur = 1100, t0 = performance.now();
    (function step(ts) {
        var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        el.innerHTML = (Number.isInteger(n) ? Math.round(n * e) : (n * e).toFixed(1)) + sfx;
        if (p < 1) requestAnimationFrame(step);
    })(t0);
}
function userLevel() {
    var s = S.streak.cur;
    if (s >= 30) return '🌳 Guardian';
    if (s >= 14) return '🌿 Champion';
    if (s >= 7) return '🍀 Activist';
    if (s >= 3) return '🌾 Aware';
    return '🌱 Seedling';
}
function actName(a) {
    var m = { car_petrol: 'Car (Petrol)', car_diesel: 'Car (Diesel)', car_electric: 'Electric Car', motorbike: 'Motorbike', bus: 'Bus', train: 'Train', flight_short: 'Short Flight', flight_long: 'Long Flight', bike: 'Cycling', electricity: 'Electricity', natural_gas: 'Natural Gas', heating_oil: 'Heating Oil', solar: 'Solar', beef: 'Beef Meal', lamb: 'Lamb Meal', pork: 'Pork Meal', chicken: 'Chicken Meal', fish: 'Fish Meal', dairy: 'Dairy Meal', eggs: 'Eggs Meal', vegetarian: 'Vegetarian Meal', vegan: 'Vegan Meal', clothing: 'Clothing', shoes: 'Shoes', smartphone: 'Smartphone', laptop: 'Laptop', tv: 'TV/Monitor', appliance: 'Appliance', book: 'Book', groceries: 'Groceries', online_order: 'Online Order' };
    var n = m[a.type] || a.type;
    if (a.category === 'transport') return n + ' · ' + a.val + ' km';
    if (a.category === 'energy') return n + ' · ' + a.val + ' units';
    if (a.category === 'diet') return n + ' · ' + a.val + ' meal' + (a.val > 1 ? 's' : '');
    if (a.category === 'shopping') return n + ' · qty ' + a.val;
    return n;
}
var CICO = { transport: '🚗', energy: '⚡', diet: '🥗', shopping: '🛍️' };
var CBG = { transport: 'rgba(96,165,250,.16)', energy: 'rgba(251,191,36,.16)', diet: 'rgba(163,230,53,.16)', shopping: 'rgba(248,113,113,.16)' };

function updateStreak() {
    var td = todayStr();
    if (S.streak.lastDate === td) return;
    var yd = new Date(); yd.setDate(yd.getDate() - 1);
    var yds = yd.toISOString().split('T')[0];
    S.streak.cur = (S.streak.lastDate === yds) ? S.streak.cur + 1 : 1;
    S.streak.lastDate = td;
    if (S.streak.cur > S.streak.best) S.streak.best = S.streak.cur;
}

var ALL_BADGES = [
    { id: 'first_log', icon: '🌱', name: 'First Step', desc: 'Log your first activity' },
    { id: 'streak_3', icon: '🔥', name: '3-Day Streak', desc: 'Log for 3 consecutive days' },
    { id: 'streak_7', icon: '💫', name: 'Week Warrior', desc: 'Log for 7 consecutive days' },
    { id: 'streak_30', icon: '🏆', name: 'Month Master', desc: '30-day logging streak' },
    { id: 'goal_hit', icon: '🎯', name: 'Goal Crusher', desc: 'Stay under your monthly goal' },
    { id: 'plant_10', icon: '🥗', name: 'Green Eater', desc: 'Log 10 plant-based meals' },
    { id: 'transit_5', icon: '🚌', name: 'Transit Hero', desc: 'Use public transit 5 times' },
    { id: 'tips_5', icon: '✅', name: 'Action Taker', desc: 'Complete 5 tips' },
    { id: 'tips_all', icon: '🌟', name: 'Eco Champion', desc: 'Complete all 12 tips' },
    { id: 'low_week', icon: '🌍', name: 'Low Carbon Week', desc: 'Under 50 kg in any week' }
];
function grantBadge(id) {
    if (S.badges.indexOf(id) < 0) { S.badges.push(id); save(); }
}
function checkBadges() {
    if (S.activities.length >= 1) grantBadge('first_log');
    if (S.streak.cur >= 3) grantBadge('streak_3');
    if (S.streak.cur >= 7) grantBadge('streak_7');
    if (S.streak.cur >= 30) grantBadge('streak_30');
    var co2 = monthCO2(), goal = S.user.goal || 500;
    if (co2 > 0 && co2 < goal) grantBadge('goal_hit');
    var plant = S.activities.filter(function (a) { return ['vegetarian', 'vegan', 'eggs'].indexOf(a.type) >= 0; }).length;
    if (plant >= 10) grantBadge('plant_10');
    var trans = S.activities.filter(function (a) { return ['bus', 'train'].indexOf(a.type) >= 0; }).length;
    if (trans >= 5) grantBadge('transit_5');
    if (S.doneTips.length >= 5) grantBadge('tips_5');
    if (S.doneTips.length >= 12) grantBadge('tips_all');
}

var CH = {};
Chart.defaults.color = '#4e6a5a';
Chart.defaults.font.family = "Inter, sans-serif";
var TTD = { backgroundColor: 'rgba(5,10,7,.96)', borderColor: 'rgba(16,185,129,.3)', borderWidth: 1, titleColor: '#93b8a5', bodyColor: '#dff2eb', padding: 12, cornerRadius: 10 };

function destroyChart(k) { if (CH[k]) { CH[k].destroy(); delete CH[k]; } }

function renderTrend() {
    destroyChart('trend');
    var ctx = document.getElementById('trendChart'); if (!ctx) return;
    var labels = [], data = [];
    for (var i = 29; i >= 0; i--) {
        var d = new Date(); d.setDate(d.getDate() - i);
        var ds = d.toISOString().split('T')[0];
        var tot = S.activities.filter(function (a) { return a.date === ds; }).reduce(function (s, a) { return s + a.co2; }, 0);
        labels.push(i % 5 === 0 ? fmtDate(ds) : '');
        data.push(parseFloat(tot.toFixed(2)));
    }
    var grad = ctx.getContext('2d').createLinearGradient(0, 0, 0, 215);
    grad.addColorStop(0, 'rgba(16,185,129,.32)'); grad.addColorStop(1, 'rgba(16,185,129,.01)');
    CH['trend'] = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: [{ data: data, borderColor: '#10b981', backgroundColor: grad, borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#10b981', pointHoverBorderColor: '#060d08', pointHoverBorderWidth: 3 }] },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...TTD, callbacks: { label: function (c) { return c.parsed.y + ' kg CO₂'; } } } },
            scales: { x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { size: 10 } } }, y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { size: 10 }, callback: function (v) { return v + ' kg'; } }, beginAtZero: true } },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}
function renderCat() {
    destroyChart('cat');
    var ctx = document.getElementById('catChart'); if (!ctx) return;
    var bd = catBreak();
    CH['cat'] = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['Transport', 'Energy', 'Diet', 'Shopping'], datasets: [{ data: [bd.transport, bd.energy, bd.diet, bd.shopping].map(function (v) { return parseFloat(v.toFixed(2)); }), backgroundColor: ['rgba(96,165,250,.8)', 'rgba(251,191,36,.8)', 'rgba(163,230,53,.8)', 'rgba(248,113,113,.8)'], borderColor: ['#60a5fa', '#fbbf24', '#a3e635', '#f87171'], borderWidth: 2, hoverOffset: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 10, padding: 10, color: '#93b8a5' } }, tooltip: { ...TTD, callbacks: { label: function (c) { return c.label + ': ' + c.parsed.toFixed(1) + ' kg'; } } } } }
    });
}
function renderMonthly() {
    destroyChart('monthly');
    var ctx = document.getElementById('monthChart'); if (!ctx) return;
    var labels = [], data = [];
    for (var i = 5; i >= 0; i--) {
        var d = new Date(); d.setMonth(d.getMonth() - i);
        labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
        data.push(parseFloat(monthCO2(i).toFixed(1)));
    }
    CH['monthly'] = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: [{ data: data, backgroundColor: data.map(function (_, i2) { return i2 === data.length - 1 ? 'rgba(16,185,129,.75)' : 'rgba(16,185,129,.28)'; }), borderColor: '#10b981', borderWidth: 2, borderRadius: 8, borderSkipped: false }] },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...TTD, callbacks: { label: function (c) { return c.parsed.y + ' kg CO₂'; } } } },
            scales: { x: { grid: { display: false }, ticks: { font: { size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { size: 11 }, callback: function (v) { return v + ' kg'; } }, beginAtZero: true } }
        }
    });
}

var curPage = 'dashboard';
function go(page) {
    document.querySelectorAll('.page').forEach(function (el) { el.classList.remove('active'); });
    document.querySelectorAll('[data-page]').forEach(function (el) { el.classList.remove('active'); });
    var pel = document.getElementById('page-' + page); if (pel) pel.classList.add('active');
    document.querySelectorAll('[data-page="' + page + '"]').forEach(function (el) { el.classList.add('active'); });
    curPage = page;
    window.scrollTo(0, 0);
    document.getElementById('fab').style.display = page === 'log' ? 'none' : 'flex';
    initPage(page);
}
document.querySelectorAll('[data-page]').forEach(function (el) {
    el.addEventListener('click', function () { go(el.dataset.page); });
});
function initPage(p) {
    if (p === 'dashboard') initDash();
    else if (p === 'log') initLog();
    else if (p === 'progress') initProgress();
    else if (p === 'tips') initTips();
    else if (p === 'community') initCommunity();
    else if (p === 'learn') initLearn();
    else if (p === 'settings') initSettings();
}


function initDash() {
    var hr = new Date().getHours();
    var g = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    var gEl = document.getElementById('wb-greet');
    if (gEl) gEl.innerHTML = g + ', <span class="grad">' + (S.user.name || 'EcoUser') + '</span> 🌿';
    var msgs = ['Every action counts. Log your activities and track your journey to a greener life.', 'Small changes compound into big impacts. What will you track today?', 'You\'re making a difference — one logged activity at a time. Keep it up! 🌱', 'The planet thanks you for your awareness. Let\'s keep reducing together.'];
    var mEl = document.getElementById('wb-msg'); if (mEl) mEl.textContent = msgs[new Date().getDate() % msgs.length];
    // Sidebar
    document.getElementById('sb-name').textContent = S.user.name || 'EcoUser';
    document.getElementById('sb-ava').textContent = (S.user.name || 'E')[0].toUpperCase();
    document.getElementById('sb-lvl').textContent = userLevel();
    // Stats
    var co2 = monthCO2(), lco2 = monthCO2(1), goal = S.user.goal || 500;
    var gpct = Math.min(100, Math.round((co2 / goal) * 100));
    var trees = Math.max(0, Math.floor((416 - co2 / (new Date().getDate() || 1)) * 0.05));
    counter('sv-co2', co2.toFixed(1), '<span class="stat-unit">kg</span>');
    counter('sv-streak', S.streak.cur, '<span class="stat-unit">days</span>');
    counter('sv-trees', trees, '<span class="stat-unit">🌳</span>');
    var gEl2 = document.getElementById('sv-goal'); if (gEl2) gEl2.innerHTML = gpct + '<span class="stat-unit">%</span>';
    var cs = document.getElementById('sv-co2s');
    if (cs) {
        var d = co2 - lco2;
        if (d < 0) { cs.textContent = '↓ ' + Math.abs(d).toFixed(1) + ' kg less than last month'; cs.className = 'stat-sub dn'; }
        else if (d > 0) { cs.textContent = '↑ ' + d.toFixed(1) + ' kg more than last month'; cs.className = 'stat-sub up'; }
        else { cs.textContent = 'Same as last month'; cs.className = 'stat-sub nt'; }
    }
    var gs = document.getElementById('sv-goals');
    if (gs) { gs.textContent = gpct >= 100 ? '⚠️ Over target!' : 'of ' + goal + ' kg target'; gs.className = 'stat-sub ' + (gpct >= 100 ? 'up' : 'nt'); }
    renderTrend(); renderCat(); renderRecentDash();
}
function renderRecentDash() {
    var el = document.getElementById('dash-recent'); if (!el) return;
    var recent = [].concat(S.activities).sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 6);
    if (recent.length === 0) {
        el.innerHTML = '<div class="empty"><span class="empty-ico">📝</span><div class="empty-ti">No activities logged yet</div><div class="empty-de">Start tracking by logging your first activity.</div><button class="btn btn-p btn-sm" onclick="go(\'log\')">Log Activity</button></div>';
        return;
    }
    el.innerHTML = recent.map(function (a) { return '<div class="log-item"><div class="log-ico" style="background:' + CBG[a.category] + '">' + CICO[a.category] + '</div><div style="flex:1"><div class="log-nm">' + actName(a) + '</div><div class="log-mt">' + daysAgo(a.date) + ' · ' + fmtDate(a.date) + '</div></div><div class="log-co2">+' + a.co2 + ' kg</div></div>'; }).join('');
}

var activeTab = 'transport';
function initLog() {
    var td = todayStr();
    ['tr-date', 'en-date', 'di-date', 'sh-date'].forEach(function (id) { var e = document.getElementById(id); if (e) e.value = td; });
    renderLogList(); calcCO2();
}
function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === tab); });
    document.querySelectorAll('.aform').forEach(function (f) { f.classList.toggle('active', f.id === 'af-' + tab); });
    calcCO2();
}
function calcCO2() {
    var co2 = 0, sub = '';
    if (activeTab === 'transport') {
        var t = document.getElementById('tr-type'), d = document.getElementById('tr-dist');
        if (t && d) { var dist = parseFloat(d.value) || 0; co2 = parseFloat((dist * (EF.transport[t.value] || 0)).toFixed(2)); sub = co2 > 0 ? '≈ ' + Math.round(co2 / 0.041) + ' km by train instead' : ''; }
    } else if (activeTab === 'energy') {
        var t2 = document.getElementById('en-type'), a = document.getElementById('en-amt');
        if (t2 && a) { var amt = parseFloat(a.value) || 0; co2 = parseFloat((amt * (EF.energy[t2.value] || 0)).toFixed(2)); sub = co2 > 0 ? '≈ ' + Math.round(co2 / 0.21) + ' km driven in a petrol car' : ''; }
    } else if (activeTab === 'diet') {
        var t3 = document.getElementById('di-type'), c = document.getElementById('di-cnt');
        if (t3 && c) { var cnt = parseFloat(c.value) || 0; co2 = parseFloat((cnt * (EF.diet[t3.value] || 0)).toFixed(2)); sub = co2 > 0 ? '≈ ' + Math.round(co2 * 4.76) + ' km cycling to offset' : ''; }
    } else if (activeTab === 'shopping') {
        var t4 = document.getElementById('sh-type'), q = document.getElementById('sh-qty');
        if (t4 && q) { var qty = parseFloat(q.value) || 0; co2 = parseFloat((qty * (EF.shopping[t4.value] || 0)).toFixed(2)); sub = co2 > 0 ? '≈ ' + Math.round(co2 / 0.21) + ' km driven in a petrol car' : ''; }
    }
    var pEl = document.getElementById('co2-prev'), nEl = document.getElementById('co2-num'), sEl = document.getElementById('co2-sub');
    if (pEl) pEl.style.display = co2 > 0 ? 'flex' : 'none';
    if (nEl) nEl.textContent = co2.toFixed(2);
    if (sEl) sEl.textContent = sub || '—';
}
function submitLog() {
    var cat = activeTab, type, val, co2, date;
    if (cat === 'transport') {
        var tt = document.getElementById('tr-type'), td2 = document.getElementById('tr-dist'), tdate = document.getElementById('tr-date');
        type = tt ? tt.value : 'car_petrol'; val = parseFloat(td2 ? td2.value : 0) || 0;
        date = tdate ? tdate.value : todayStr();
        if (!val) { showToast('Please enter a distance', '⚠️'); return; }
        co2 = parseFloat((val * EF.transport[type]).toFixed(2));
        if (td2) td2.value = '';
    } else if (cat === 'energy') {
        var et = document.getElementById('en-type'), ea = document.getElementById('en-amt'), edate = document.getElementById('en-date');
        type = et ? et.value : 'electricity'; val = parseFloat(ea ? ea.value : 0) || 0;
        date = edate ? edate.value : todayStr();
        if (!val) { showToast('Please enter an amount', '⚠️'); return; }
        co2 = parseFloat((val * EF.energy[type]).toFixed(2));
        if (ea) ea.value = '';
    } else if (cat === 'diet') {
        var dt3 = document.getElementById('di-type'), dc = document.getElementById('di-cnt'), ddate = document.getElementById('di-date');
        type = dt3 ? dt3.value : 'chicken'; val = parseFloat(dc ? dc.value : 0) || 0;
        date = ddate ? ddate.value : todayStr();
        if (!val) { showToast('Please enter meal count', '⚠️'); return; }
        co2 = parseFloat((val * EF.diet[type]).toFixed(2));
        if (dc) dc.value = '';
    } else {
        var st = document.getElementById('sh-type'), sq = document.getElementById('sh-qty'), sdate = document.getElementById('sh-date');
        type = st ? st.value : 'clothing'; val = parseFloat(sq ? sq.value : 0) || 0;
        date = sdate ? sdate.value : todayStr();
        if (!val) { showToast('Please enter a quantity', '⚠️'); return; }
        co2 = parseFloat((val * EF.shopping[type]).toFixed(2));
        if (sq) sq.value = '';
    }
    S.activities.unshift({ id: uid(), date: date, category: cat, type: type, val: val, co2: co2 });
    updateStreak(); checkBadges(); save();
    calcCO2(); renderLogList();
    showToast(co2.toFixed(2) + ' kg CO₂ logged! 🌿');
}
function renderLogList() {
    var el = document.getElementById('log-list'); if (!el) return;
    var logs = [].concat(S.activities).sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 25);
    if (logs.length === 0) { el.innerHTML = '<div class="empty"><span class="empty-ico">📋</span><div class="empty-ti">No logs yet</div><div class="empty-de">Your activity history will appear here.</div></div>'; return; }
    el.innerHTML = logs.map(function (a) { return '<div class="log-item"><div class="log-ico" style="background:' + CBG[a.category] + '">' + CICO[a.category] + '</div><div style="flex:1"><div class="log-nm">' + actName(a) + '</div><div class="log-mt">' + daysAgo(a.date) + ' · ' + fmtDate(a.date) + '</div></div><div class="log-co2">+' + a.co2 + ' kg</div><button class="log-del" onclick="delLog(\'' + a.id + '\')" title="Delete">✕</button></div>'; }).join('');
}
function delLog(id) { S.activities = S.activities.filter(function (a) { return a.id !== id; }); save(); renderLogList(); showToast('Entry removed', '🗑️'); }
function clearLogs() { if (!confirm('Delete all activity logs? Cannot be undone.')) return; S.activities = []; save(); renderLogList(); showToast('All logs cleared', '🗑️'); }

// ═══════════════════════════════════════════════════
//  PROGRESS
// ═══════════════════════════════════════════════════
function initProgress() {
    var co2 = monthCO2(), goal = S.user.goal || 500;
    var pct = Math.min(100, Math.round((co2 / goal) * 100));
    var ring = document.getElementById('goal-ring');
    if (ring) setTimeout(function () { ring.style.strokeDashoffset = 440 - (pct / 100) * 440; ring.setAttribute('stroke', pct >= 100 ? '#f87171' : 'url(#rg)'); }, 80);
    var rp = document.getElementById('rg-pct'); if (rp) rp.textContent = pct + '%';
    var rl = document.getElementById('rg-lbl'); if (rl) rl.textContent = pct >= 100 ? 'Over target!' : 'of target';
    var ra = document.getElementById('rg-act'); if (ra) ra.textContent = co2.toFixed(1);
    var rt = document.getElementById('rg-tgt'); if (rt) rt.textContent = goal;
    var gb = document.getElementById('goal-bar'); if (gb) setTimeout(function () { gb.style.width = pct + '%'; if (pct >= 100) gb.classList.add('danger'); else gb.classList.remove('danger'); }, 100);
    var total = S.activities.reduce(function (s, a) { return s + a.co2; }, 0);
    var days = Object.keys(S.activities.reduce(function (o, a) { o[a.date] = 1; return o; }, {})).length || 1;
    var avg = total / days;
    var set = function (id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; };
    set('ps-logs', S.activities.length);
    set('ps-co2', total.toFixed(0) + '<span style="font-size:15px">kg</span>');
    set('ps-avg', avg.toFixed(1) + '<span style="font-size:15px">kg</span>');
    set('ps-str', S.streak.best + '<span style="font-size:15px">d</span>');
    renderMonthly(); updateCmp(co2); checkBadges(); renderBadges();
}
function updateCmp(co2) {
    var refs = { 'cmp-g': 416, 'cmp-u': 1354, 'cmp-e': 625, 'cmp-i': 133 };
    Object.keys(refs).forEach(function (id) {
        var el = document.getElementById(id), avg = refs[id]; if (!el) return;
        if (co2 === 0) { el.textContent = '—'; return; }
        var d = co2 - avg;
        el.textContent = d < 0 ? Math.abs(d).toFixed(0) + ' kg less ✓' : d.toFixed(0) + ' kg more';
        el.className = 'val ' + (d < 0 ? 'better' : 'worse');
    });
}
function renderBadges() {
    var el = document.getElementById('badges-grid'); if (!el) return;
    el.innerHTML = ALL_BADGES.map(function (b) { return '<div class="bdg ' + (S.badges.indexOf(b.id) >= 0 ? 'earned' : 'locked') + '" title="' + b.desc + '"><div class="bdg-ico">' + b.icon + '</div><div class="bdg-nm">' + b.name + '</div></div>'; }).join('');
}

// ═══════════════════════════════════════════════════
//  TIPS / RECOMMENDATIONS
// ═══════════════════════════════════════════════════
var ALL_TIPS = [
    { id: 't01', cat: 'transport', tag: 'high', icon: '🚌', title: 'Switch to Public Transit', desc: 'Replace one car commute per week with bus or train — 70-80% less CO₂ per km.', detail: 'A petrol car emits 0.21 kg/km; a train emits only 0.041 kg/km — an 80% reduction. For a 30 km daily commute 5 days/week, switching to rail saves ~510 kg CO₂/month!', saving: 'Up to 510 kg/month', diff: 'Medium' },
    { id: 't02', cat: 'diet', tag: 'high', icon: '🥗', title: 'Try Meat-Free Mondays', desc: 'Replacing one beef meal per week with plant-based cuts significant emissions.', detail: 'Beef produces 6.0 kg CO₂e per meal; a vegan meal only 0.3 kg — a 95% reduction. Just one meat-free day per week saves ~24 kg CO₂/month.', saving: '~24 kg/month', diff: 'Easy' },
    { id: 't03', cat: 'energy', tag: 'high', icon: '🌡️', title: 'Reduce Home Heating', desc: 'Lowering your thermostat by 1°C can cut heating energy use by 7-10%.', detail: 'Heating accounts for up to 70% of home energy use. A smart thermostat and improved insulation dramatically cut your footprint.', saving: 'Up to 150 kg/month', diff: 'Easy' },
    { id: 't04', cat: 'transport', tag: 'quick', icon: '🚲', title: 'Cycle for Short Trips', desc: 'Replace car trips under 5 km with cycling or walking — zero emissions, better health!', detail: 'Over 60% of car trips are under 8 km. Cycling a 5 km commute daily avoids ~1 kg CO₂/day, saving 20+ kg/month.', saving: '~20 kg/month', diff: 'Easy' },
    { id: 't05', cat: 'energy', tag: 'quick', icon: '💡', title: 'Switch to LED Lighting', desc: 'LEDs use 75% less energy than incandescent bulbs and last 25× longer.', detail: 'Replacing 10 incandescents with LEDs saves 300-500 kWh/year. At average grid emissions, that prevents ~100 kg CO₂ annually.', saving: '~8 kg/month', diff: 'Easy' },
    { id: 't06', cat: 'shopping', tag: 'quick', icon: '♻️', title: 'Buy Secondhand First', desc: 'Before buying new clothing or electronics, check secondhand shops first.', detail: 'Manufacturing a t-shirt produces ~10 kg CO₂. Buying secondhand avoids this entirely. Shifting 50% of purchases to secondhand saves 60+ kg/year.', saving: '60+ kg/year', diff: 'Easy' },
    { id: 't07', cat: 'transport', tag: 'high', icon: '🚂', title: 'Replace Short Flights with Rail', desc: 'Substitute flights under 800 km with train journeys — 83% less CO₂.', detail: 'Short-haul flight: 0.255 kg/km vs. train: 0.041 kg/km. London-Paris by plane emits ~90 kg; Eurostar only ~6 kg.', saving: 'Up to 90 kg per trip', diff: 'Hard' },
    { id: 't08', cat: 'energy', tag: 'high', icon: '☀️', title: 'Consider Solar Panels', desc: 'A 4 kW solar system can offset 80-100% of home electricity carbon footprint.', detail: 'A 4kW system generates ~3,500 kWh/year. At average grid emissions, this avoids ~815 kg CO₂/year.', saving: 'Up to 815 kg/year', diff: 'Hard' },
    { id: 't09', cat: 'diet', tag: 'quick', icon: '🥡', title: 'Reduce Food Waste', desc: 'Wasting 30% less food reduces dietary emissions by up to 10%.', detail: '~30% of all food globally is wasted, generating 8-10% of global GHGs. Meal planning and using leftovers are easy first steps.', saving: '~15 kg/month', diff: 'Easy' },
    { id: 't10', cat: 'shopping', tag: 'high', icon: '📱', title: 'Extend Device Lifespan', desc: 'Using your smartphone one extra year avoids ~70 kg CO₂ of manufacturing.', detail: 'Manufacturing a smartphone produces ~70 kg CO₂. Replacing every 2 years instead of every year halves this impact.', saving: '70 kg per device cycle', diff: 'Easy' },
    { id: 't11', cat: 'energy', tag: 'quick', icon: '🔌', title: 'Unplug Standby Devices', desc: 'Standby power can be 10% of home electricity — unplug devices when idle.', detail: 'TVs, consoles, and chargers in standby collectively waste significant energy. Smart power strips save 50-100 kWh/year.', saving: '~6 kg/month', diff: 'Easy' },
    { id: 't12', cat: 'diet', tag: 'high', icon: '🌱', title: 'Explore Plant-Based Diet', desc: 'A vegan diet produces 50-73% less CO₂ than an average meat-eating diet.', detail: 'Oxford research shows going vegan reduces dietary emissions by 50-73%. Average meat-eater: ~2.5t CO₂e/yr; vegan: ~0.6t.', saving: 'Up to 165 kg/month', diff: 'Hard' }
];
var tipFilter = 'all';
function initTips() { renderTips(); }
function filterTips(btn) {
    document.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
    btn.classList.add('active'); tipFilter = btn.dataset.filter; renderTips();
}
function getTopCat() {
    var bd = catBreak();
    var top = Object.keys(bd).reduce(function (a, b) { return bd[b] > bd[a] ? b : a; }, 'transport');
    return { cat: top, val: bd[top] };
}
function renderTips() {
    var grid = document.getElementById('tips-grid'); if (!grid) return;
    var top = getTopCat();
    var ts = document.getElementById('tips-sub');
    if (ts && top.val > 0) ts.textContent = 'Your biggest source is ' + top.cat + ' (' + top.val.toFixed(1) + ' kg CO₂). Here are your personalized tips:';
    var sorted = ALL_TIPS.map(function (t) { return Object.assign({}, t, { priority: t.cat === top.cat ? 2 : 1 }); }).sort(function (a, b) { return b.priority - a.priority; });
    var filtered = tipFilter === 'all' ? sorted : tipFilter === 'quick' ? sorted.filter(function (t) { return t.tag === 'quick'; }) : tipFilter === 'high' ? sorted.filter(function (t) { return t.tag === 'high'; }) : sorted.filter(function (t) { return t.cat === tipFilter; });
    var done = S.doneTips.length, total = ALL_TIPS.length, pct = Math.round((done / total) * 100);
    document.getElementById('tips-dn').textContent = done;
    var tb = document.getElementById('tips-bar'); if (tb) setTimeout(function () { tb.style.width = pct + '%'; }, 100);
    document.getElementById('tips-pct').textContent = pct + '%';
    var catCls = { transport: 'ct1', energy: 'ct2', diet: 'ct3', shopping: 'ct4' };
    grid.innerHTML = filtered.map(function (t) {
        var isDone = S.doneTips.indexOf(t.id) >= 0;
        var isTop = t.priority === 2 && !isDone;
        return '<div class="tip-card ' + (isDone ? 'done' : '') + '" id="tc-' + t.id + '" onclick="expandTip(\'' + t.id + '\')">' +
            '<div class="tip-check">✓</div>' +
            (isTop ? '<div class="tip-star">⭐ For You</div>' : '') +
            '<span class="cbadge ' + catCls[t.cat] + '">' + t.icon + ' ' + t.cat + '</span>' +
            '<div class="tip-title">' + t.title + '</div>' +
            '<div class="tip-desc">' + t.desc + '</div>' +
            '<div class="tip-det">' + t.detail + '</div>' +
            '<div class="tip-footer">' +
            '<div><div class="tip-save">💚 ' + t.saving + '</div><div class="tip-diff">Effort: ' + t.diff + '</div></div>' +
            '<button class="btn btn-sm ' + (isDone ? 'btn-g' : 'btn-s') + '" onclick="event.stopPropagation();toggleDone(\'' + t.id + '\')" style="font-size:11px;padding:5px 12px">' + (isDone ? '↩ Undo' : '✓ Done') + '</button>' +
            '</div>' +
            '</div>';
    }).join('');
}
function expandTip(id) { var e = document.getElementById('tc-' + id); if (e) e.classList.toggle('exp'); }
function toggleDone(id) {
    var idx = S.doneTips.indexOf(id);
    if (idx >= 0) { S.doneTips.splice(idx, 1); showToast('Tip marked pending', '↩️'); }
    else { S.doneTips.push(id); showToast('Tip completed! Great work 🎉'); }
    checkBadges(); save(); renderTips();
}

// ═══════════════════════════════════════════════════
//  COMMUNITY
// ═══════════════════════════════════════════════════
var CHALLENGES = [
    { id: 'c1', icon: '🚗', bg: 'rgba(96,165,250,.12)', bc: 'rgba(96,165,250,.3)', title: 'Car-Free Week', desc: 'Go 7 days without a personal vehicle. Use transit, cycling, or walking.', ppl: 2847, days: 5, pts: '100 pts' },
    { id: 'c2', icon: '🌱', bg: 'rgba(163,230,53,.1)', bc: 'rgba(163,230,53,.3)', title: 'Plant-Based Month', desc: 'Eat plant-based meals for 30 days and cut your food footprint by 50%.', ppl: 4312, days: 18, pts: '250 pts' },
    { id: 'c3', icon: '⚡', bg: 'rgba(251,191,36,.1)', bc: 'rgba(251,191,36,.3)', title: 'Energy Savers Sprint', desc: 'Reduce electricity use by 20% compared to last month through smart habits.', ppl: 1923, days: 12, pts: '150 pts' },
    { id: 'c4', icon: '♻️', bg: 'rgba(248,113,113,.1)', bc: 'rgba(248,113,113,.3)', title: 'Zero New Purchases', desc: 'Buy nothing new for 2 weeks. Repair, borrow, or go without.', ppl: 876, days: 8, pts: '120 pts' }
];
var SIM_LB = [
    { name: 'Sarah K.', ini: 'SK', score: 842, c: '#10b981' }, { name: 'Tom W.', ini: 'TW', score: 791, c: '#60a5fa' },
    { name: 'Priya M.', ini: 'PM', score: 756, c: '#a3e635' }, { name: 'Carlos R.', ini: 'CR', score: 712, c: '#fbbf24' },
    { name: 'Amara O.', ini: 'AO', score: 698, c: '#f87171' }
];
function comScore() {
    return Math.min(200, S.activities.length * 5) + S.doneTips.length * 20 + S.streak.cur * 10 + (monthCO2() < (S.user.goal || 500) && monthCO2() > 0 ? 100 : 0);
}
function initCommunity() { renderChallenges(); renderLB(); }
function renderChallenges() {
    var el = document.getElementById('ch-list'); if (!el) return;
    var jl = document.getElementById('ch-joined'); if (jl) jl.textContent = S.challenges.length + ' joined';
    el.innerHTML = CHALLENGES.map(function (c) {
        var j = S.challenges.indexOf(c.id) >= 0;
        return '<div class="ch-card ' + (j ? 'joined' : '') + '" style="' + (j ? 'border-color:' + c.bc : '') + '"><div class="ch-ico" style="background:' + c.bg + '">' + c.icon + '</div><div style="flex:1"><div class="ch-title">' + c.title + '</div><div class="ch-desc">' + c.desc + '</div><div class="ch-meta"><div class="ch-mi">👥 <strong>' + c.ppl.toLocaleString() + '</strong> participants</div><div class="ch-mi">⏳ <strong>' + c.days + '</strong> days left</div><div class="ch-mi">🏅 <strong>' + c.pts + '</strong></div></div></div><div style="flex-shrink:0;margin-left:12px"><button class="btn btn-sm ' + (j ? 'btn-g' : 'btn-p') + '" onclick="toggleCh(\'' + c.id + '\')">' + (j ? '✓ Joined' : 'Join') + '</button></div></div>';
    }).join('');
}
function toggleCh(id) {
    var i = S.challenges.indexOf(id);
    if (i >= 0) { S.challenges.splice(i, 1); showToast('Left challenge', '↩️'); }
    else { S.challenges.push(id); showToast('Challenge joined! Good luck! 💪', '🏆'); }
    save(); renderChallenges(); renderLB();
}
function renderLB() {
    var el = document.getElementById('leaderboard'); if (!el) return;
    var s = comScore(), nm = S.user.name || 'You';
    var all = SIM_LB.concat([{ name: nm + ' (You)', ini: (nm[0] || 'Y').toUpperCase(), score: s, c: '#a3e635', you: true }]).sort(function (a, b) { return b.score - a.score; });
    var rc = ['gold', 'silver', 'bronze'];
    el.innerHTML = all.slice(0, 8).map(function (p, i) { return '<div class="lb-item ' + (p.you ? 'you' : '') + '"><div class="lb-rank ' + (rc[i] || '') + '">' + (i + 1) + '</div><div class="lb-ava" style="background:' + p.c + '22;color:' + p.c + '">' + p.ini + '</div><div class="lb-name">' + p.name + '</div><div class="lb-pts">' + p.score + ' pts</div></div>'; }).join('');
}
function shareProgress() {
    var co2 = monthCO2().toFixed(1), s = S.streak.cur;
    var text = '🌍 I\'ve tracked ' + co2 + ' kg of CO₂ this month with a ' + s + '-day streak on EcoTrack! Join me in reducing our carbon footprint. #EcoTrack #CarbonFootprint #ClimateAction';
    if (navigator.clipboard) { navigator.clipboard.writeText(text).then(function () { showToast('Achievement copied to clipboard! 📋', '📊'); }); }
    else showToast('Keep tracking! 🌱', '🌍');
}

// ═══════════════════════════════════════════════════
//  LEARN & QUIZ
// ═══════════════════════════════════════════════════
var LEARN = [
    { e: '🌡️', t: 'What is a Carbon Footprint?', bg: 'rgba(16,185,129,.08)', d: 'Your carbon footprint is the total greenhouse gases — mainly CO₂ and methane — produced through your daily activities: driving, eating, heating your home, and consuming products.', rt: '3 min read' },
    { e: '🏭', t: 'Where Does CO₂ Come From?', bg: 'rgba(251,191,36,.08)', d: 'Energy production (34%), agriculture (19%), industry (24%), transport (16%), and buildings (7%). Understanding these sectors helps identify the highest-impact reduction areas.', rt: '4 min read' },
    { e: '🌊', t: 'Impact of Climate Change', bg: 'rgba(96,165,250,.08)', d: 'Every tonne of CO₂ contributes to global warming. Limiting warming to 1.5°C requires cutting emissions by 45% by 2030. The costs of inaction far exceed those of acting now.', rt: '5 min read' },
    { e: '🥩', t: 'Food & Emissions', bg: 'rgba(163,230,53,.08)', d: 'Food systems account for 26% of global emissions. Beef produces 20× more emissions per gram of protein than legumes. Dietary choices are one of the highest-impact individual actions.', rt: '4 min read' },
    { e: '✈️', t: 'Aviation & Your Footprint', bg: 'rgba(248,113,113,.08)', d: 'Aviation contributes 2.5% of global CO₂ but has a much greater climate warming effect at altitude. One transatlantic flight can emit more CO₂ than a month of driving.', rt: '3 min read' },
    { e: '🌳', t: 'Nature-Based Solutions', bg: 'rgba(20,184,166,.08)', d: 'Forests absorb 2.6 billion tonnes of CO₂/year. Protecting and restoring ecosystems is cost-effective — but cannot replace direct emission reductions. Both are essential.', rt: '4 min read' }
];
var QUIZ = [
    { q: 'What food produces the most CO₂ per kg of protein?', opts: ['Beef (20× more than legumes)', 'Chicken', 'Eggs', 'Tofu'], ans: 0, expl: 'Beef generates ~60 kg CO₂e per 100g protein — 20× more than legumes. Livestock farming drives land-use change and methane emissions.' },
    { q: 'By how much can going vegan reduce your dietary CO₂?', opts: ['10-15%', '25-35%', '50-73%', 'Over 90%'], ans: 2, expl: 'Oxford researchers Poore & Nemecek (2018) found vegan diets produce 50-73% less CO₂e than average meat-eating diets.' },
    { q: 'What percentage of global emissions comes from transport?', opts: ['5%', '16%', '35%', '50%'], ans: 1, expl: 'Transport accounts for ~16% of global GHG emissions, with road vehicles contributing the largest share (~12%).' },
    { q: 'How much CO₂ does a mature tree absorb per year?', opts: ['5 kg', '22 kg', '80 kg', '200 kg'], ans: 1, expl: 'A mature tree absorbs approximately 22 kg of CO₂/year. Offsetting an average person\'s footprint would require ~1,000 trees.' },
    { q: 'Which action has the biggest single-year individual CO₂ impact?', opts: ['Switching to LED bulbs', 'Going car-free', 'Taking one fewer long-haul flight', 'Using a reusable bag'], ans: 1, expl: 'Going car-free saves on average ~2.4 tonnes CO₂/year — the single biggest lifestyle action identified by climate researchers.' }
];
var qz = { i: 0, score: 0, answered: [] };
function initLearn() { renderLearnCards(); renderQuiz(); }
function renderLearnCards() {
    var el = document.getElementById('learn-grid'); if (!el) return;
    el.innerHTML = LEARN.map(function (c) { return '<div class="lc" style="background:' + c.bg + '"><div class="lc-body"><span class="lc-em">' + c.e + '</span><div class="lc-ti">' + c.t + '</div><div class="lc-de">' + c.d + '</div></div><div class="lc-ft"><span class="lc-rt">📖 ' + c.rt + '</span><button class="btn btn-sm btn-g" style="font-size:11px">Explore →</button></div></div>'; }).join('');
}
function renderQuiz() {
    var el = document.getElementById('quiz-wrap'); if (!el) return;
    var qpts = document.getElementById('quiz-pts'); if (qpts) qpts.textContent = qz.score * 20 + ' pts';
    if (qz.i >= QUIZ.length) {
        var pct = Math.round((qz.score / QUIZ.length) * 100);
        el.innerHTML = '<div class="quiz-box"><div style="text-align:center;padding:20px"><div class="qscore">' + pct + '%</div><div style="font-size:19px;font-weight:800;margin-bottom:7px">' + (pct >= 80 ? '🎉 Excellent!' : pct >= 60 ? '👍 Good job!' : '📚 Keep learning!') + '</div><div style="font-size:14px;color:var(--t2);margin-bottom:24px">You got ' + qz.score + ' of ' + QUIZ.length + ' correct.</div><button class="btn btn-p" onclick="resetQuiz()">Retake Quiz</button></div></div>';
        return;
    }
    var q = QUIZ[qz.i];
    var pips = QUIZ.map(function (_, i) { return '<div class="qpip' + (qz.answered[i] === true ? ' c' : qz.answered[i] === false ? ' w' : '') + '"></div>'; }).join('');
    el.innerHTML = '<div class="quiz-box"><div class="qpips">' + pips + '</div><div style="font-size:12px;color:var(--t3);margin-bottom:10px;font-weight:700">Question ' + (qz.i + 1) + ' of ' + QUIZ.length + '</div><div class="qq">' + q.q + '</div><div class="qopts">' + q.opts.map(function (o, i) { return '<button class="qopt" id="qo' + i + '" onclick="answerQ(' + i + ')">' + (String.fromCharCode(65 + i)) + '. ' + o + '</button>'; }).join('') + '</div></div>';
}
function answerQ(idx) {
    var q = QUIZ[qz.i], ok = idx === q.ans;
    if (ok) qz.score++;
    qz.answered[qz.i] = ok;
    document.querySelectorAll('.qopt').forEach(function (b, i) { b.disabled = true; if (i === q.ans) b.classList.add('correct'); else if (i === idx && !ok) b.classList.add('wrong'); });
    var expl = document.createElement('div'); expl.className = 'qexpl';
    expl.innerHTML = '<strong style="color:' + (ok ? 'var(--em)' : 'var(--coral)') + '">' + (ok ? '✓ Correct!' : '✗ Incorrect.') + '</strong> ' + q.expl;
    document.querySelector('.qopts').after(expl);
    setTimeout(function () { qz.i++; renderQuiz(); }, 2600);
}
function resetQuiz() { qz = { i: 0, score: 0, answered: [] }; renderQuiz(); }


function initSettings() {
    var u = S.user;
    var sv = function (id, v) { var e = document.getElementById(id); if (e) e.value = v || ''; };
    sv('s-name', u.name); sv('s-loc', u.location); sv('s-lifestyle', u.lifestyle); sv('s-goal', u.goal);
}
function saveSetting() {
    S.user.name = document.getElementById('s-name')?.value || 'EcoUser';
    S.user.location = document.getElementById('s-loc')?.value || 'global';
    S.user.lifestyle = document.getElementById('s-lifestyle')?.value || 'average';
    S.user.goal = parseInt(document.getElementById('s-goal')?.value) || 500;
    document.getElementById('sb-name').textContent = S.user.name;
    document.getElementById('sb-ava').textContent = S.user.name[0].toUpperCase();
    save();
}
function exportData() {
    var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'ecotrack-export-' + todayStr() + '.json'; a.click(); URL.revokeObjectURL(a.href);
    showToast('Data exported!', '📄');
}
function deleteData() {
    if (!confirm('⚠️ This permanently deletes ALL your data including activities, badges, and settings. Cannot be undone. Proceed?')) return;
    localStorage.removeItem('ecotrack');
    S = JSON.parse(JSON.stringify(DEFAULT)); save();
    showToast('All data deleted. Fresh start 🌱', '🗑️');
    initSettings();
}


var td2 = todayStr();
['tr-date', 'en-date', 'di-date', 'sh-date'].forEach(function (id) { var e = document.getElementById(id); if (e) e.value = td2; });
go('dashboard');
