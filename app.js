let channels = [];
const pieChartElement = document.getElementById('pie-chart').getContext('2d');
const comboChartElement = document.getElementById('combo-chart').getContext('2d');
const conversionsCostChartElement = document.getElementById('conversions-cost-chart').getContext('2d');
let pieChart, comboChart, conversionsCostChart;

document.getElementById('add-channel-btn').addEventListener('click', addChannelRow);
document.getElementById('remove-channels-btn').addEventListener('click', removeAddedChannels);
document.getElementById('reset-channels-btn').addEventListener('click', resetAddedChannels);
document.getElementById('input-section').addEventListener('input', handleInput);

// Event listeners for focus and blur for formatting inputs
document.getElementById('input-section').addEventListener('focusin', handleFocus);
document.getElementById('input-section').addEventListener('focusout', handleBlur);

function handleInput(e) {
    const targetRow = e.target.closest('.input-row');
    const inputs = Array.from(targetRow.querySelectorAll('input'));
    const [channel, ctr, cpc, convRate, budget] = inputs.map(input => input.value.trim());

    const index = [...document.getElementById('input-section').children].indexOf(targetRow);

    // Normalize percentage values
    const normalizePercentage = value => {
        if (!value) return 0;
        const cleanValue = parseFloat(value.replace('%', ''));
        return isNaN(cleanValue) ? 0 : cleanValue / 100;
    };

    channels[index] = {
        channel: channel || `Channel ${index + 1}`,
        ctr: normalizePercentage(ctr),
        cpc: parseFloat(cpc.replace('$', '').replace(',', '')) || 0,
        convRate: normalizePercentage(convRate),
        budget: parseFloat(budget.replace('$', '').replace(',', '')) || 0,
    };

    updateTable();
    updateCharts();
}

function addChannelRow() {
    const inputSection = document.getElementById('input-section');
    const row = document.createElement('div');
    row.className = 'input-row';
    row.innerHTML = `
        <div class="input-group">
            <label>Marketing Channel</label>
            <input type="text" placeholder="Enter your channel name" class="channel-input">
        </div>
        <div class="input-group">
            <label>CTR</label>
            <input type="text" placeholder="Your CTR" class="ctr-input">
        </div>
        <div class="input-group">
            <label>CPC</label>
            <input type="text" placeholder="Your CPC" class="cpc-input">
        </div>
        <div class="input-group">
            <label>Conversion Rate</label>
            <input type="text" placeholder="Your Conv Rate" class="conv-rate-input">
        </div>
        <div class="input-group">
            <label>Media Budget</label>
            <input type="text" placeholder="Media Cost" class="media-budget-input">
        </div>`;
    inputSection.appendChild(row);
}

function removeAddedChannels() {
    const inputSection = document.getElementById('input-section');
    channels = channels.slice(0, 1);

    while (inputSection.children.length > 1) {
        inputSection.removeChild(inputSection.lastChild);
    }

    const firstRowInputs = inputSection.querySelector('.input-row').querySelectorAll('input');
    firstRowInputs.forEach(input => input.value = '');

    updateTable();
    updateCharts();
}

function resetAddedChannels() {
    const inputSection = document.getElementById('input-section');
    const rows = inputSection.querySelectorAll('.input-row');
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => input.value = '');
    });

    channels = channels.map(channel => ({
        ...channel,
        ctr: 0,
        cpc: 0,
        convRate: 0,
        budget: 0,
    }));

    updateTable();
    updateCharts();
}

function handleFocus(e) {
    const input = e.target;
    if (input && (input.classList.contains('ctr-input') || input.classList.contains('conv-rate-input'))) {
        input.value = input.value.replace('%', '').trim();
    }
    if (input && (input.classList.contains('cpc-input') || input.classList.contains('media-budget-input'))) {
        input.value = input.value.replace('$', '').replace(',', '').trim();
    }
}

function handleBlur(e) {
    const input = e.target;
    if (input && input.classList.contains('ctr-input')) {
        input.value = formatAsPercentage(input.value);
    }
    if (input && input.classList.contains('conv-rate-input')) {
        input.value = formatAsPercentage(input.value);
    }
    if (input && input.classList.contains('cpc-input')) {
        input.value = formatAsCurrency(input.value);
    }
    if (input && input.classList.contains('media-budget-input')) {
        input.value = formatAsCurrency(input.value);
    }
}

function formatAsPercentage(value) {
    if (value === '' || isNaN(value)) return '';
    let num = parseFloat(value);
    return `${num.toFixed(2)}%`;
}

function formatAsCurrency(value) {
    if (value === '' || isNaN(value)) return '';
    let num = parseFloat(value.replace(',', ''));
    return `$${num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

function updateTable() {
    const tbody = document.querySelector('#media-plan-table tbody');
    tbody.innerHTML = '';

    channels.forEach(channel => {
        const clicks = channel.budget / channel.cpc || 0;
        const conversions = clicks * channel.convRate || 0;
        const impressions = clicks / channel.ctr || 0;
        const cpm = channel.budget / impressions * 1000 || 0;
        const costPerConv = conversions ? channel.budget / conversions : 0;

        const row = `
            <tr>
                <td>${channel.channel}</td>
                <td>${Math.round(impressions).toLocaleString()}</td>
                <td>${Math.round(clicks).toLocaleString()}</td>
                <td>${(channel.ctr * 100).toFixed(2)}%</td>
                <td>$${channel.cpc.toFixed(2)}</td>
                <td>$${cpm.toFixed(2)}</td>
                <td>${conversions.toFixed(2)}</td>
                <td>$${costPerConv.toFixed(2)}</td>
                <td>${(channel.convRate * 100).toFixed(2)}%</td>
                <td>$${channel.budget.toLocaleString()}</td>
            </tr>`;
        tbody.innerHTML += row;
    });
}

function updateCharts() {
    const labels = channels.map(c => c.channel);

    const totalBudget = channels.reduce((sum, c) => sum + c.budget, 0);
    const data = channels.map(c => c.budget);

    if (pieChart) pieChart.destroy();
    pieChart = new Chart(pieChartElement, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            const value = tooltipItem.raw;
                            const percentage = totalBudget ? (value / totalBudget * 100).toFixed(2) : 0;
                            return `${tooltipItem.label}: $${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        },
    });

    const impressions = channels.map(c => c.budget / c.cpc / c.ctr || 0);
    const clicks = channels.map(c => c.budget / c.cpc || 0);

    if (comboChart) comboChart.destroy();
    comboChart = new Chart(comboChartElement, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Impressions', data: impressions, backgroundColor: '#36A2EB', yAxisID: 'y1' },
                { label: 'Clicks', data: clicks, backgroundColor: '#FF6384', yAxisID: 'y2' },
            ],
        },
        options: {
            scales: {
                y1: { beginAtZero: true, position: 'left', ticks: { callback: value => value.toLocaleString() } },
                y2: { beginAtZero: true, position: 'right', ticks: { callback: value => value.toLocaleString() } },
            },
            responsive: true,
            plugins: { legend: { position: 'top' } },
        },
    });

    const conversions = channels.map(c => c.budget / c.cpc * c.convRate || 0);
    const cost = channels.map(c => c.budget);

    if (conversionsCostChart) conversionsCostChart.destroy();
    conversionsCostChart = new Chart(conversionsCostChartElement, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Conversions', data: conversions, backgroundColor: '#FFCE56', yAxisID: 'y1' },
                { label: 'Cost', data: cost, backgroundColor: '#4BC0C0', yAxisID: 'y2' },
            ],
        },
        options: {
            scales: {
                y1: { beginAtZero: true, position: 'left', ticks: { callback: value => value.toLocaleString() } },
                y2: { beginAtZero: true, position: 'right', ticks: { callback: value => `$${value.toLocaleString()}` } },
            },
            responsive: true,
            plugins: { legend: { position: 'top' } },
        },
    });
}
