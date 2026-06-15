let currentRange = 'all';
let charts = {};

// Chart.js Default Config
Chart.defaults.color = '#666';
Chart.defaults.font.family = "'Space Grotesk', sans-serif";

function checkFirstTime() {
    if (!localStorage.getItem('inex-v2-visited')) {
        document.getElementById('v2-modal').classList.remove('hidden');
    }
}

function closeModal() {
    document.getElementById('v2-modal').classList.add('hidden');
    localStorage.setItem('inex-v2-visited', 'true');
}

async function populateFilters() {
    try {
        const response = await fetch('/api/filters');
        const data = await response.json();
        
        const agentSelect = document.getElementById('filter-agent');
        const modelSelect = document.getElementById('filter-model');
        
        if (agentSelect) {
            agentSelect.innerHTML = '<option value="">All Agents</option>';
            data.agents.forEach(agent => {
                const opt = document.createElement('option');
                opt.value = opt.innerText = agent;
                agentSelect.appendChild(opt);
            });
        }
        
        if (modelSelect) {
            modelSelect.innerHTML = '<option value="">All Models</option>';
            data.models.forEach(model => {
                const opt = document.createElement('option');
                opt.value = opt.innerText = model;
                modelSelect.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('Error populating filters:', error);
    }
}

async function fetchData() {
    try {
        const agentEl = document.getElementById('filter-agent');
        const modelEl = document.getElementById('filter-model');
        const startEl = document.getElementById('custom-start');
        const endEl = document.getElementById('custom-end');
        
        const agent = agentEl ? agentEl.value : '';
        const model = modelEl ? modelEl.value : '';
        const start = startEl ? startEl.value : '';
        const end = endEl ? endEl.value : '';
        
        let url = \`/api/analytics?range=\${currentRange}\`;
        if (agent) url += \`&agent=\${encodeURIComponent(agent)}\`;
        if (model) url += \`&model=\${encodeURIComponent(model)}\`;
        if (currentRange === 'custom' && start && end) {
            url += \`&start=\${start}&end=\${end}\`;
        }

        const response = await fetch(url);
        const data = await response.json();
        
        updateStats(data.stats || {});
        updateLogs(data.all_logs || []);
        initCharts(data.charts || {});
        
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}

function updateStats(stats) {
    const costEl = document.getElementById('stat-total-cost');
    const tokenEl = document.getElementById('stat-total-tokens');
    const avgCostEl = document.getElementById('stat-avg-cost-1m');
    const ioRatioEl = document.getElementById('stat-io-ratio');

    if (costEl) costEl.innerText = \`$\${parseFloat(stats.total_cost || 0).toFixed(4)}\`;
    if (tokenEl) tokenEl.innerText = (stats.total_tokens || 0).toLocaleString();
    if (avgCostEl) avgCostEl.innerText = \`$\${stats.avg_cost_per_1m || '0.00'}\`;
    if (ioRatioEl) ioRatioEl.innerText = stats.input_output_ratio || '0.00';
}

function updateLogs(allLogs) {
    const tbody = document.getElementById('logs-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    allLogs.forEach(log => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-800 hover:bg-gray-900/40 transition-colors';

        const date = new Date(log.created_at).toLocaleString('en-US', { hour12: false });

        tr.innerHTML = \`
            <td class="py-4 text-gray-500 font-mono text-[9px]">\${date}</td>
            <td class="py-4 font-bold text-white">\${log.agent_name}</td>
            <td class="py-4 text-gray-400">\${log.model_name}</td>
            <td class="py-4 font-mono text-cyan-500">\${(log.input_tokens || 0).toLocaleString()}</td>
            <td class="py-4 font-mono text-purple-500">\${(log.output_tokens || 0).toLocaleString()}</td>
            <td class="py-4 font-mono text-white font-bold">\$\${parseFloat(log.cost || 0).toFixed(6)}</td>
        \`;
        tbody.appendChild(tr);
    });
}

function initCharts(chartData) {
    // Multi-Axis Economic Trend Chart
    const trendCanvas = document.getElementById('mainTrendChart');
    if (trendCanvas) {
        const ctx = trendCanvas.getContext('2d');
        if (charts.mainTrend) charts.mainTrend.destroy();

        const labels = Object.keys(chartData.trends || {}).sort();
        charts.mainTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'TOKEN VOLUME',
                        data: labels.map(l => chartData.trends[l]),
                        borderColor: '#bc13fe',
                        backgroundColor: 'rgba(188, 19, 254, 0.05)',
                        fill: true,
                        yAxisID: 'y',
                        tension: 0.4
                    },
                    {
                        label: 'EXPENDITURE ($)',
                        data: labels.map(l => chartData.cost_trends[l]),
                        borderColor: '#00f2ff',
                        borderWidth: 2,
                        yAxisID: 'y1',
                        pointRadius: 4,
                        pointBackgroundColor: '#00f2ff'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 9 }, color: '#999' } } },
                scales: {
                    y: { type: 'linear', display: true, position: 'left', grid: { color: '#111' }, title: { display: true, text: 'Tokens', color: '#666', font: { size: 9 } } },
                    y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'USD ($)', color: '#666', font: { size: 9 } } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // Model Distribution Chart
    const modelPieCanvas = document.getElementById('modelPieChart');
    if (modelPieCanvas) {
        const ctx = modelPieCanvas.getContext('2d');
        if (charts.modelPie) charts.modelPie.destroy();
        charts.modelPie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(chartData.models || {}),
                datasets: [{
                    data: Object.values(chartData.models || {}),
                    backgroundColor: ['#00f2ff', '#39ff14', '#bc13fe', '#ff0055', '#ffaa00'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%',
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 8 }, color: '#555', padding: 15 } } }
            }
        });
    }

    // Agent Load Chart
    const agentBarCanvas = document.getElementById('agentBarChart');
    if (agentBarCanvas) {
        const ctx = agentBarCanvas.getContext('2d');
        if (charts.agentBar) charts.agentBar.destroy();
        charts.agentBar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(chartData.agents || {}),
                datasets: [{
                    data: Object.values(chartData.agents || {}),
                    backgroundColor: 'rgba(0, 242, 255, 0.1)',
                    borderColor: '#00f2ff',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: '#111' } },
                    y: { grid: { display: false } }
                }
            }
        });
    }
}

function updateRange(range) {
    currentRange = range;
    document.querySelectorAll('.range-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase().includes(range.replace('days', '')) || (range === 'all' && btn.innerText.toLowerCase() === 'all'));
    });
    fetchData();
}

// Initial Load
document.addEventListener('DOMContentLoaded', async () => {
    checkFirstTime();
    await populateFilters();
    fetchData();
});
