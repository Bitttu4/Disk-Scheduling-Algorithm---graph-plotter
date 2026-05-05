let chart;
let stepIndex = 0;
let currentSequence = [];

/* =====================
   INPUT PARSE
===================== */
function parseInput() {
  const diskSize = parseInt(document.getElementById("diskSize").value);
  const queue = document.getElementById("queue").value.split(",").map(Number);
  const head = parseInt(document.getElementById("head").value);
  const direction = document.getElementById("direction").value;

  if (!diskSize || isNaN(head) || queue.includes(NaN)) {
    alert("Please enter valid inputs!");
    return null;
  }

  if (queue.some(x => x >= diskSize || x < 0)) {
    alert("Requests must be within disk size!");
    return null;
  }

  return { diskSize, queue, head, direction };
}

/* =====================
   ALGORITHMS
===================== */

function fcfs(req, head) {
  let seek = 0, seq = [head];
  req.forEach(r => {
    seek += Math.abs(head - r);
    head = r;
    seq.push(r);
  });
  return { sequence: seq, totalSeek: seek };
}

function sstf(req, head) {
  let seek = 0, seq = [head];
  let arr = [...req];

  while (arr.length) {
    let closest = arr.reduce((a,b) =>
      Math.abs(b-head) < Math.abs(a-head) ? b : a
    );
    seek += Math.abs(head - closest);
    head = closest;
    seq.push(closest);
    arr.splice(arr.indexOf(closest),1);
  }

  return { sequence: seq, totalSeek: seek };
}

function scan(req, head, diskSize, dir) {
  let seek = 0, seq = [head];
  let left = req.filter(x => x < head).sort((a,b)=>b-a);
  let right = req.filter(x => x >= head).sort((a,b)=>a-b);

  if (dir === "left") {
    left.push(0);
    [...left, ...right].forEach(r => {
      seek += Math.abs(head - r);
      head = r;
      seq.push(r);
    });
  } else {
    right.push(diskSize-1);
    [...right, ...left].forEach(r => {
      seek += Math.abs(head - r);
      head = r;
      seq.push(r);
    });
  }

  return { sequence: seq, totalSeek: seek };
}

function cscan(req, head, diskSize) {
  let seek = 0, seq = [head];
  let left = req.filter(x => x < head).sort((a,b)=>a-b);
  let right = req.filter(x => x >= head).sort((a,b)=>a-b);

  right.push(diskSize-1);
  right.forEach(r => {
    seek += Math.abs(head - r);
    head = r;
    seq.push(r);
  });

  head = 0;
  seq.push(0);

  left.forEach(r => {
    seek += Math.abs(head - r);
    head = r;
    seq.push(r);
  });

  return { sequence: seq, totalSeek: seek };
}

function look(req, head, dir) {
  let seek = 0, seq = [head];
  let left = req.filter(x => x < head).sort((a,b)=>b-a);
  let right = req.filter(x => x >= head).sort((a,b)=>a-b);

  let order = dir === "left" ? [...left, ...right] : [...right, ...left];

  order.forEach(r => {
    seek += Math.abs(head - r);
    head = r;
    seq.push(r);
  });

  return { sequence: seq, totalSeek: seek };
}

function clook(req, head) {
  let seek = 0, seq = [head];
  let left = req.filter(x => x < head).sort((a,b)=>a-b);
  let right = req.filter(x => x >= head).sort((a,b)=>a-b);

  right.forEach(r => {
    seek += Math.abs(head - r);
    head = r;
    seq.push(r);
  });

  if (left.length) {
    head = left[0];
    seq.push(head);
  }

  left.forEach(r => {
    seek += Math.abs(head - r);
    head = r;
    seq.push(r);
  });

  return { sequence: seq, totalSeek: seek };
}

/* =====================
   GRAPH
===================== */
function drawChart(sequence) {
  const ctx = document.getElementById("chart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: sequence.map((_, i) => i),
      datasets: [{
        label: "Head Movement",
        data: sequence,
        borderWidth: 2
      }]
    },
    options: {
      animation: true
    }
  });
}

/* =====================
   RUN (UPDATED)
===================== */
function runSimulation() {
  const data = parseInput();
  if (!data) return;

  const algo = document.getElementById("algorithm").value;

  let result;

  switch (algo) {
    case "fcfs":
      result = fcfs(data.queue, data.head);
      break;
    case "sstf":
      result = sstf(data.queue, data.head);
      break;
    case "scan":
      result = scan(data.queue, data.head, data.diskSize, data.direction);
      break;
    case "cscan":
      result = cscan(data.queue, data.head, data.diskSize);
      break;
    case "look":
      result = look(data.queue, data.head, data.direction);
      break;
    case "clook":
      result = clook(data.queue, data.head);
      break;
    default:
      alert("Invalid Algorithm");
      return;
  }

  currentSequence = result.sequence;
  stepIndex = 0;

  drawChart(result.sequence);

  document.getElementById("totalSeek").innerText = result.totalSeek;
  document.getElementById("avgSeek").innerText =
    (result.totalSeek / data.queue.length).toFixed(2);
  document.getElementById("sequence").innerText =
    result.sequence.join(" → ");
}

/* =====================
   STEP MODE
===================== */
function stepMode() {
  if (!currentSequence.length) {
    alert("Run simulation first!");
    return;
  }

  if (stepIndex >= currentSequence.length - 1) {
    document.getElementById("stepInfo").innerText = "Completed ✔";
    return;
  }

  let from = currentSequence[stepIndex];
  let to = currentSequence[stepIndex + 1];
  let seek = Math.abs(from - to);

  document.getElementById("stepInfo").innerText =
    `Head moved from ${from} → ${to} (Seek = ${seek})`;

  stepIndex++;
}

/* =====================
   OTHER
===================== */

function compareAll() {
  const data = parseInput();
  if (!data) return;

  const results = {
    FCFS: fcfs(data.queue, data.head),
    SSTF: sstf(data.queue, data.head),
    SCAN: scan(data.queue, data.head, data.diskSize, data.direction),
    CSCAN: cscan(data.queue, data.head, data.diskSize),
    LOOK: look(data.queue, data.head, data.direction),
    CLOOK: clook(data.queue, data.head)
  };

  let tbody = document.querySelector("#compareTable tbody");
  tbody.innerHTML = "";

  let best = Math.min(...Object.values(results).map(r => r.totalSeek));

  for (let key in results) {
    let row = `<tr style="color:${results[key].totalSeek===best?'#00ffcc':'white'}">
      <td>${key}</td>
      <td>${results[key].totalSeek}</td>
    </tr>`;
    tbody.innerHTML += row;
  }
}

function loadExample() {
  document.getElementById("queue").value =
    "98,183,37,122,14,124,65,67";
  document.getElementById("head").value = 53;
  document.getElementById("diskSize").value = 200;
}

function resetAll() {
  location.reload();
}

/* =====================
   INFO
===================== */

document.getElementById("info").innerHTML = `
<b>FCFS:</b> Simple, no starvation<br>
<b>SSTF:</b> Fast but may starve<br>
<b>SCAN:</b> Elevator algorithm<br>
<b>C-SCAN:</b> Circular movement<br>
<b>LOOK:</b> Stops at last request<br>
<b>C-LOOK:</b> Circular LOOK
`;