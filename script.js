// ======================= GLOBALS & STATE =======================
let currentSimulation = null;
let currentStepIndex = 0;
let playbackInterval = null;
let movementChart = null, seekChart = null, compareChart = null;

// DOM Elements
const requestQueueInput = document.getElementById('requestQueue');
const headStartInput = document.getElementById('headStart');
const diskSizeInput = document.getElementById('diskSize');
const directionSelect = document.getElementById('direction');
const algorithmSelect = document.getElementById('algorithm');
const runBtn = document.getElementById('runBtn');
const compareBtn = document.getElementById('compareBtn');
const resetBtn = document.getElementById('resetBtn');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const resetSimBtn = document.getElementById('resetSimBtn');
const totalSeekSpan = document.getElementById('totalSeek');
const avgSeekSpan = document.getElementById('avgSeek');
const headMovementsSpan = document.getElementById('headMovements');
const throughputSpan = document.getElementById('throughput');
const headPathContainer = document.getElementById('headPathContainer');
const stepTableBody = document.getElementById('stepTableBody');

// ======================= HELPER FUNCTIONS =======================
function showError(msg) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function parseRequestQueue(str) {
    let cleaned = str.replace(/\s/g, '');
    let parts = cleaned.split(',');
    let requests = [];
    for (let p of parts) {
        if (p === '') continue;
        let num = Number(p);
        if (isNaN(num)) throw new Error(`Invalid number: ${p}`);
        if (num < 0) throw new Error(`Negative cylinder: ${num}`);
        requests.push(num);
    }
    if (requests.length === 0) throw new Error('Request queue is empty');
    return requests;
}

// ======================= DISK SCHEDULING ALGORITHMS =======================
function fcfs(requests, start, diskSize) {
    let steps = [];
    let current = start;
    let totalSeek = 0;
    let order = [start];
    for (let i = 0; i < requests.length; i++) {
        const req = requests[i];
        const distance = Math.abs(req - current);
        totalSeek += distance;
        steps.push({ step: i+1, request: req, position: req, distance: distance, cumulative: totalSeek });
        current = req;
        order.push(req);
    }
    return { steps, order, totalSeek, avgSeek: totalSeek / requests.length, movements: requests.length };
}

function sstf(requests, start, diskSize) {
    let steps = [];
    let remaining = [...requests];
    let current = start;
    let totalSeek = 0;
    let order = [start];
    for (let i = 0; i < requests.length; i++) {
        let minDist = Infinity;
        let minIdx = -1;
        for (let j = 0; j < remaining.length; j++) {
            const dist = Math.abs(remaining[j] - current);
            if (dist < minDist) {
                minDist = dist;
                minIdx = j;
            }
        }
        const req = remaining[minIdx];
        totalSeek += minDist;
        steps.push({ step: i+1, request: req, position: req, distance: minDist, cumulative: totalSeek });
        current = req;
        order.push(req);
        remaining.splice(minIdx, 1);
    }
    return { steps, order, totalSeek, avgSeek: totalSeek / requests.length, movements: requests.length };
}

function scan(requests, start, diskSize, direction) {
    let steps = [];
    let sorted = [...requests].sort((a,b) => a-b);
    let totalSeek = 0;
    let current = start;
    let order = [start];
    let processed = [];
    
    if (direction === 'right') {
        let right = sorted.filter(r => r >= current);
        let left = sorted.filter(r => r < current).reverse();
        let fullOrder = [...right, ...left];
        for (let req of fullOrder) {
            const dist = Math.abs(req - current);
            totalSeek += dist;
            steps.push({ step: steps.length+1, request: req, position: req, distance: dist, cumulative: totalSeek });
            current = req;
            order.push(req);
        }
    } else {
        let left = sorted.filter(r => r <= current).reverse();
        let right = sorted.filter(r => r > current);
        let fullOrder = [...left, ...right];
        for (let req of fullOrder) {
            const dist = Math.abs(req - current);
            totalSeek += dist;
            steps.push({ step: steps.length+1, request: req, position: req, distance: dist, cumulative: totalSeek });
            current = req;
            order.push(req);
        }
    }
    return { steps, order, totalSeek, avgSeek: totalSeek / requests.length, movements: requests.length };
}

function cscan(requests, start, diskSize, direction) {
    let steps = [];
    let sorted = [...requests].sort((a,b) => a-b);
    let totalSeek = 0;
    let current = start;
    let order = [start];
    
    if (direction === 'right') {
        let right = sorted.filter(r => r >= current);
        let left = sorted.filter(r => r < current);
        let fullOrder = [...right, ...left];
        for (let req of fullOrder) {
            const dist = Math.abs(req - current);
            totalSeek += dist;
            steps.push({ step: steps.length+1, request: req, position: req, distance: dist, cumulative: totalSeek });
            current = req;
            order.push(req);
        }
    } else {
        let left = sorted.filter(r => r <= current).reverse();
        let right = sorted.filter(r => r > current).reverse();
        let fullOrder = [...left, ...right];
        for (let req of fullOrder) {
            const dist = Math.abs(req - current);
            totalSeek += dist;
            steps.push({ step: steps.length+1, request: req, position: req, distance: dist, cumulative: totalSeek });
            current = req;
            order.push(req);
        }
    }
    return { steps, order, totalSeek, avgSeek: totalSeek / requests.length, movements: requests.length };
}

function look(requests, start, diskSize, direction) {
    // LOOK is same as SCAN but without going to the end
    return scan(requests, start, diskSize, direction);
}

function clook(requests, start, diskSize, direction) {
    // C-LOOK is same as C-SCAN but without going to the end
    return cscan(requests, start, diskSize, direction);
}

function runAlgorithm(algorithm, requests, start, diskSize, direction) {
    switch(algorithm) {
        case 'fcfs': return fcfs(requests, start, diskSize);
        case 'sstf': return sstf(requests, start, diskSize);
        case 'scan': return scan(requests, start, diskSize, direction);
        case 'cscan': return cscan(requests, start, diskSize, direction);
        case 'look': return look(requests, start, diskSize, direction);
        case 'clook': return clook(requests, start, diskSize, direction);
        default: return fcfs(requests, start, diskSize);
    }
}

// ======================= UI RENDERING =======================
function updateStatistics(sim) {
    totalSeekSpan.innerText = sim.totalSeek;
    avgSeekSpan.innerText = sim.avgSeek.toFixed(2);
    headMovementsSpan.innerText = sim.movements;
    const throughput = sim.movements > 0 ? (sim.movements / sim.totalSeek).toFixed(4) : 0;
    throughputSpan.innerText = throughput;
}

function renderHeadPath(order, currentIndex) {
    headPathContainer.innerHTML = '';
    for (let i = 0; i < order.length; i++) {
        const step = document.createElement('span');
        step.className = 'path-step';
        if (i === currentIndex) step.classList.add('current');
        step.innerText = order[i];
        headPathContainer.appendChild(step);
        if (i < order.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'path-arrow';
            arrow.innerText = '→';
            headPathContainer.appendChild(arrow);
        }
    }
}

function renderStepTable(sim, currentStep) {
    stepTableBody.innerHTML = '';
    for (let i = 0; i <= currentStep; i++) {
        const step = sim.steps[i];
        if (!step) continue;
        const row = `
            <tr>
                <td>${step.step}</td>
                <td>${step.request}</td>
                <td>${step.position}</td>
                <td>${step.distance}</td>
                <td>${step.cumulative}</td>
            </tr>
        `;
        stepTableBody.insertAdjacentHTML('beforeend', row);
    }
}

function drawMovementChart(sim) {
    const ctx = document.getElementById('headMovementChart').getContext('2d');
    const labels = ['Start', ...sim.steps.map(s => `Req ${s.request}`)];
    const positions = [sim.order[0], ...sim.steps.map(s => s.position)];
    if (movementChart) movementChart.destroy();
    movementChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cylinder Position',
                data: positions,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56,189,248,0.1)',
                fill: true,
                tension: 0.2,
                pointRadius: 5,
                pointBackgroundColor: '#facc15'
            }]
        },
        options: { responsive: true, plugins: { tooltip: { callbacks: { label: (ctx) => `Cylinder: ${ctx.raw}` } } } }
    });
}

function drawSeekDistanceChart(sim) {
    const ctx = document.getElementById('seekDistanceChart').getContext('2d');
    const labels = sim.steps.map(s => `Step ${s.step}`);
    const distances = sim.steps.map(s => s.distance);
    if (seekChart) seekChart.destroy();
    seekChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Seek Distance', data: distances, backgroundColor: '#f97316' }] },
        options: { responsive: true }
    });
}

// ======================= COMPARE ALL =======================
function compareAll() {
    let requests, start, diskSize, direction;
    try {
        requests = parseRequestQueue(requestQueueInput.value);
        start = parseInt(headStartInput.value);
        diskSize = parseInt(diskSizeInput.value);
        direction = directionSelect.value;
        if (isNaN(start) || start < 0) throw new Error('Invalid head start');
        if (isNaN(diskSize) || diskSize < 1) throw new Error('Invalid disk size');
    } catch(e) { showError(e.message); return; }
    
    const algorithms = ['fcfs', 'sstf', 'scan', 'cscan', 'look', 'clook'];
    const results = [];
    for (let algo of algorithms) {
        const sim = runAlgorithm(algo, requests, start, diskSize, direction);
        results.push({ name: algo.toUpperCase(), totalSeek: sim.totalSeek, avgSeek: sim.avgSeek, movements: sim.movements });
    }
    
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    if (compareChart) compareChart.destroy();
    compareChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: results.map(r => r.name),
            datasets: [{ label: 'Total Seek Time', data: results.map(r => r.totalSeek), backgroundColor: '#4ade80' }]
        },
        options: { responsive: true }
    });
    
    const container = document.getElementById('comparisonTableContainer');
    container.innerHTML = `
        <table style="width:100%">
            <thead><tr><th>Algorithm</th><th>Total Seek</th><th>Avg Seek</th><th>Movements</th></tr></thead>
            <tbody>
                ${results.map(r => `<tr><td>${r.name}</td><td>${r.totalSeek}</td><td>${r.avgSeek.toFixed(2)}</td><td>${r.movements}</td></tr>`).join('')}
            </tbody>
        </table>
    `;
}

// ======================= PLAYBACK =======================
function stopPlayback() {
    if (playbackInterval) { clearInterval(playbackInterval); playbackInterval = null; }
}

function startPlayback() {
    if (!currentSimulation) return;
    stopPlayback();
    playbackInterval = setInterval(() => {
        if (currentStepIndex < currentSimulation.steps.length - 1) {
            setStep(currentStepIndex + 1);
        } else {
            stopPlayback();
        }
    }, 800);
}

function setStep(index) {
    if (!currentSimulation) return;
    currentStepIndex = Math.min(Math.max(0, index), currentSimulation.steps.length);
    renderHeadPath(currentSimulation.order, currentStepIndex);
    renderStepTable(currentSimulation, currentStepIndex - 1);
    updatePlaybackButtons();
}

function updatePlaybackButtons() {
    const hasSim = currentSimulation !== null;
    playBtn.disabled = !hasSim;
    pauseBtn.disabled = !hasSim;
    nextBtn.disabled = !hasSim;
    prevBtn.disabled = !hasSim;
    resetSimBtn.disabled = !hasSim;
    if (hasSim && currentSimulation.steps.length > 0) {
        prevBtn.disabled = (currentStepIndex === 0);
        nextBtn.disabled = (currentStepIndex === currentSimulation.steps.length);
    }
}

function resetSimulationView() {
    if (!currentSimulation) return;
    stopPlayback();
    setStep(0);
}

function runSimulation() {
    stopPlayback();
    let requests, start, diskSize, direction;
    try {
        requests = parseRequestQueue(requestQueueInput.value);
        start = parseInt(headStartInput.value);
        diskSize = parseInt(diskSizeInput.value);
        direction = directionSelect.value;
        if (isNaN(start) || start < 0) throw new Error('Initial head position must be >= 0');
        if (isNaN(diskSize) || diskSize < 1) throw new Error('Disk size must be >= 1');
        for (let r of requests) {
            if (r >= diskSize) throw new Error(`Request ${r} exceeds disk size ${diskSize-1}`);
        }
    } catch(e) { showError(e.message); return; }
    
    const algorithm = algorithmSelect.value;
    const sim = runAlgorithm(algorithm, requests, start, diskSize, direction);
    currentSimulation = sim;
    currentStepIndex = 0;
    updateStatistics(sim);
    renderHeadPath(sim.order, 0);
    renderStepTable(sim, -1);
    drawMovementChart(sim);
    drawSeekDistanceChart(sim);
    updatePlaybackButtons();
}

// ======================= ALGORITHM INFO CARDS =======================
function buildAlgoInfo() {
    const info = {
        fcfs: { name: 'FCFS', desc: 'First-Come-First-Serve: processes requests in arrival order.', adv: 'Fair, no starvation.', disadv: 'Poor performance (convoy effect).', time: 'O(n)', space: 'O(1)' },
        sstf: { name: 'SSTF', desc: 'Shortest Seek Time First: selects request with minimum seek distance.', adv: 'Better avg response time.', disadv: 'Starvation possible.', time: 'O(n^2)', space: 'O(n)' },
        scan: { name: 'SCAN', desc: 'Elevator algorithm: sweeps back and forth across disk.', adv: 'No starvation, good throughput.', disadv: 'Uneven wait times.', time: 'O(n log n)', space: 'O(n)' },
        cscan: { name: 'C-SCAN', desc: 'Circular SCAN: sweeps one direction then jumps back.', adv: 'Uniform wait time.', disadv: 'Extra seek for return.', time: 'O(n log n)', space: 'O(n)' },
        look: { name: 'LOOK', desc: 'SCAN but stops at last request in each direction.', adv: 'Less movement than SCAN.', disadv: 'More complex.', time: 'O(n log n)', space: 'O(n)' },
        clook: { name: 'C-LOOK', desc: 'Circular LOOK: goes only to last request then jumps.', adv: 'Efficient, minimal movement.', disadv: 'Implementation complexity.', time: 'O(n log n)', space: 'O(n)' }
    };
    const grid = document.getElementById('algoInfoGrid');
    for (let [key, val] of Object.entries(info)) {
        const card = document.createElement('div');
        card.className = 'algo-card';
        card.innerHTML = `
            <div class="algo-header">${val.name} <span>▼</span></div>
            <div class="algo-content">
                <p><strong>Definition:</strong> ${val.desc}</p>
                <p><strong>Advantages:</strong> ${val.adv}</p>
                <p><strong>Disadvantages:</strong> ${val.disadv}</p>
                <p><strong>Time Complexity:</strong> ${val.time} &nbsp;|&nbsp; <strong>Space:</strong> ${val.space}</p>
            </div>
        `;
        const header = card.querySelector('.algo-header');
        header.addEventListener('click', () => {
            card.classList.toggle('open');
            const arrow = header.querySelector('span');
            arrow.innerText = card.classList.contains('open') ? '▲' : '▼';
        });
        grid.appendChild(card);
    }
}

// ======================= INIT =======================
document.addEventListener('DOMContentLoaded', () => {
    buildAlgoInfo();
    runBtn.addEventListener('click', runSimulation);
    compareBtn.addEventListener('click', compareAll);
    resetBtn.addEventListener('click', () => location.reload());
    playBtn.addEventListener('click', startPlayback);
    pauseBtn.addEventListener('click', stopPlayback);
    nextBtn.addEventListener('click', () => { if(currentSimulation) setStep(currentStepIndex + 1); });
    prevBtn.addEventListener('click', () => { if(currentSimulation) setStep(currentStepIndex - 1); });
    resetSimBtn.addEventListener('click', resetSimulationView);
    runSimulation();
});