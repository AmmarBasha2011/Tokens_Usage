let currentRange = 'all';
let charts = {};

// Chart.js Default Config
Chart.defaults.color = '#666';
Chart.defaults.font.family = "'Space Grotesk', sans-serif";

async function populateFilters() {
    try {
        const response = await fetch('/api/filters');
        const data = await response.json();
        
        const agentSelect = document.getElementById('filter-agent');
        const modelSelect = document.getElementById('filter-model');
        
        if (agentSelect) {
            data.agents.forEach(agent => {
                const opt = document.createElement('option');
                opt.value = opt.innerText = agent;
                agentSelect.appendChild(opt);
            });
        }
        
        if (modelSelect) {
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
        
        let url = `/api/analytics?range=${currentRange}`;
        if (agent) url += `&agent=${encodeURIComponent(agent)}`;
        if (model) url += `&model=${encodeURIComponent(model)}`;
        if (currentRange === 'custom' && start && end) {
            url += `&start=${start}&end=${end}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        
        updateStats(data.stats || {});
        updateLogs(data.all_logs || []);
        initCharts(data.charts || {});
        
        if (model) {
            showModelPricing(model);
        } else {
            const pricingCard = document.getElementById('model-pricing-card');
            if (pricingCard) pricingCard.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}

async function showModelPricing(modelId) {
    try {
        const response = await fetch('/api/models');
        const data = await response.json();
        if (!data.data) return;
        
        const modelInfo = data.data.find(m => m.id === modelId);
        const pricingCard = document.getElementById('model-pricing-card');
        
        if (modelInfo && pricingCard) {
            pricingCard.classList.remove('hidden');
            document.getElementById('selected-model-name').innerText = modelInfo.name || modelId;
            
            const inPrice = (parseFloat(modelInfo.pricing.prompt) * 1000000).toFixed(2);
            const outPrice = (parseFloat(modelInfo.pricing.completion) * 1000000).toFixed(2);
            
            document.getElementById('price-input').innerText = `$${inPrice} / 1M`;
            document.getElementById('price-output').innerText = `$${outPrice} / 1M`;
        }
    } catch (error) {
        console.error('Error fetching model pricing:', error);
    }
}

function updateStats(stats) {
    const costEl = document.getElementById('stat-total-cost');
    const inputEl = document.getElementById('stat-input-tokens');
    const outputEl = document.getElementById('stat-output-tokens');

    if (costEl) costEl.innerText = `$${parseFloat(stats.total_cost || 0).toFixed(4)}`;
    if (inputEl) inputEl.innerText = (stats.total_input_tokens || 0).toLocaleString();
    if (outputEl) outputEl.innerText = (stats.total_output_tokens || 0).toLocaleString();
}

function updateLogs(allLogs) {
    // UI no longer has a record count element in the latest version but we keep data for logs if needed
}

function initCharts(chartData) {
    // Trend Chart
    const trendCanvas = document.getElementById('trendChart');
    if (trendCanvas) {
        const trendCtx = trendCanvas.getContext('2d');
        if (charts.trend) charts.trend.destroy();
        charts.trend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: Object.keys(chartData.trends || {}),
                datasets: [{
                    label: 'TOTAL TOKENS',
                    data: Object.values(chartData.trends || {}),
                    borderColor: '#00f2ff',
                    backgroundColor: 'rgba(0, 242, 255, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: '#00f2ff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: '#111' }, border: { display: false } },
                    x: { grid: { display: false }, border: { display: false } }
                }
            }
        });
    }

    // Model Chart
    const modelCanvas = document.getElementById('modelChart');
    if (modelCanvas) {
        const modelCtx = modelCanvas.getContext('2d');
        if (charts.model) charts.model.destroy();
        charts.model = new Chart(modelCtx, {
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
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9 }, color: '#555', padding: 15 } } },
                cutout: '80%'
            }
        });
    }

    // Agent Chart
    const agentCanvas = document.getElementById('agentChart');
    if (agentCanvas) {
        const agentCtx = agentCanvas.getContext('2d');
        if (charts.agent) charts.agent.destroy();
        charts.agent = new Chart(agentCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(chartData.agents || {}),
                datasets: [{
                    data: Object.values(chartData.agents || {}),
                    backgroundColor: 'rgba(188, 19, 254, 0.1)',
                    borderColor: '#bc13fe',
                    borderWidth: 1,
                    borderRadius: 0
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: '#111' }, border: { display: false } },
                    y: { grid: { display: false }, border: { display: false } }
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
    await populateFilters();
    fetchData();
});
