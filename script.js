let chart;

// Utility
function parseInput() {
  const diskSize = +document.getElementById("diskSize").value;
  const head = +document.getElementById("head").value;
  const queue = document.getElementById("queue").value
    .split(",").map(Number);

  if (queue.some(q => q >= diskSize || q < 0)) {
    alert("Invalid request out of disk range");
    return null;
  }

  return { diskSize, head, queue };
}

// ======================
// ALGORITHMS
// ======================

// FCFS
function fcfs(head, queue) {
  let seq = [head, ...queue];
  return calculate(seq);
}

// SSTF
function sstf(head, queue) {
  let remaining = [...queue];
  let seq = [head];

  while (remaining.length) {
    let closest = remaining.reduce((a, b) =>
      Math.abs(b - head) < Math.abs(a - head) ? b : a
    );
    seq.push(closest);
    remaining = remaining.filter(x => x !== closest);
    head = closest;
  }

  return calculate(seq);
}

// SCAN
function scan(head, queue, diskSize, dir) {
  let left = queue.filter(x => x < head).sort((a,b)=>b-a);
  let right = queue.filter(x => x >= head).sort((a,b)=>a-b);

  let seq = [head];

  if (dir === "right") {
    seq.push(...right, diskSize-1, ...left);
  } else {
    seq.push(...left, 0, ...right);
  }

  return calculate(seq);
}

// LOOK
function look(head, queue, dir) {
  let left = queue.filter(x => x < head).sort((a,b)=>b-a);
  let right = queue.filter(x => x >= head).sort((a,b)=>a-b);

  let seq = [head];

  if (dir === "right") {
    seq.push(...right, ...left);
  } else {
    seq.push(...left, ...right);
  }

  return calculate(seq);
}

// C-SCAN
function cscan(head, queue, diskSize) {
  let left = queue.filter(x => x < head).sort((a,b)=>a-b);
  let right = queue.filter(x => x >= head).sort((a,b)=>a-b);

  let seq = [head, ...right, diskSize-1, 0, ...left];
  return calculate(seq);
}

// C-LOOK
function clook(head, queue) {
  let left = queue.filter(x => x < head).sort((a,b)=>a-b);
  let right = queue.filter(x => x >= head).sort((a,b)=>a-b);

  let seq = [head, ...right, ...left];
  return calculate(seq);
}

// ======================
// CALCULATE SEEK
// ======================

function calculate(seq) {
  let total = 0;

  for (let i = 1; i < seq.length; i++) {
    total += Math.abs(seq[i] - seq[i - 1]);
  }

  return {
    sequence: seq,
    total,
    avg: total / (seq.length - 1)
  };
}

// ======================
// VISUALIZATION
// ======================

function plotGraph(sequence) {
  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels: sequence.map((_, i) => i),
      datasets: [{
        label: "Head Movement",
        data: sequence,
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      scales: {
        y: { title: { display: true, text: "Track" } },
        x: { title: { display: true, text: "Step" } }
      }
    }
  });
}

// ======================
// RUN
// ======================

function runSimulation() {
  const data = parseInput();
  if (!data) return;

  let res = fcfs(data.head, data.queue);

  display(res);
  plotGraph(res.sequence);
}

// ======================
// STEP MODE
// ======================

async function stepMode() {
  const data = parseInput();
  if (!data) return;

  let res = sstf(data.head, data.queue);

  for (let i = 1; i < res.sequence.length; i++) {
    let prev = res.sequence[i-1];
    let curr = res.sequence[i];

    document.getElementById("seekSequence").innerText =
      `Step ${i}: ${prev} → ${curr}`;

    plotGraph(res.sequence.slice(0, i+1));

    await new Promise(r => setTimeout(r, 800));
  }

  display(res);
}

// ======================
// DISPLAY
// ======================

function display(res) {
  document.getElementById("seekSequence").innerText =
    "Sequence: " + res.sequence.join(" → ");

  document.getElementById("totalSeek").innerText =
    "Total Seek Time: " + res.total;

  document.getElementById("avgSeek").innerText =
    "Average Seek Time: " + res.avg.toFixed(2);
}

// ======================
// COMPARE
// ======================

function compareAll() {
  const data = parseInput();
  if (!data) return;

  const results = {
    FCFS: fcfs(data.head, data.queue),
    SSTF: sstf(data.head, data.queue),
    SCAN: scan(data.head, data.queue, data.diskSize, "right"),
    LOOK: look(data.head, data.queue, "right"),
    CSCAN: cscan(data.head, data.queue, data.diskSize),
    CLOOK: clook(data.head, data.queue)
  };

  console.table(results);

  alert("Check console for comparison table");
}

// ======================
// UTIL
// ======================

function resetAll() {
  location.reload();
}

function loadExample() {
  document.getElementById("queue").value =
    "98,183,37,122,14,124,65,67";

  document.getElementById("head").value = 53;
  document.getElementById("diskSize").value = 200;
}