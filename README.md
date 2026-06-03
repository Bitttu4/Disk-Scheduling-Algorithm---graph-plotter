# Disk Scheduling Algorithm Graph Plotter

> Enhanced interactive visualization of FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK disk scheduling algorithms.  
> Built with pure HTML/CSS/JS and Chart.js. Step-by-step head movement simulation with playback controls, statistical metrics, and algorithm comparison.

## Features

- **6 Disk Scheduling Algorithms:** FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK.
- **Direction Control:** Choose initial sweep direction (Right/Left) for SCAN/C-SCAN/LOOK/C-LOOK.
- **Step-by-Step Simulation:**
  - Visual head path display (cylinder sequence with arrows)
  - Detailed table: step, request, head position, seek distance, cumulative seek
- **Playback Controls:** Play, Pause, Next, Previous, Reset Simulation – walk through each request.
- **Statistical Metrics:** Total seek time, average seek, number of head movements, throughput.
- **Graphs:**
  - Head movement trajectory over time (line chart)
  - Seek distance per request (bar chart)
- **Compare All Mode:** Run all six algorithms simultaneously, view comparison bar chart and table.
- **Algorithm Information Cards:** Collapsible cards with definition, advantages/disadvantages, time & space complexity.
- **Glassmorphism UI:** Modern, consistent styling with the original Disk Scheduling project.

## Usage

1. Enter **Request Queue** (comma-separated cylinder numbers, e.g., `98,183,37,122,14,124,65,67`).
2. Set **Initial Head Position** (e.g., `53`).
3. Set **Disk Size** (maximum cylinder number, e.g., `200`).
4. Choose **Direction** (Right/Left) – relevant for SCAN, C-SCAN, LOOK, C-LOOK.
5. Pick an **Algorithm** from the dropdown.
6. Click **Run Simulation** to see the path visualization, statistics, and graphs.
7. Use **Playback Controls** to step through the request sequence.
8. Click **Compare All** to evaluate all algorithms on the same input.
9. Expand **Algorithm Information** cards for theoretical details.

## Algorithms Implemented

| Algorithm | Description |
| ----------- | ------------- |
| **FCFS** | First-Come-First-Serve – processes requests in arrival order. |
| **SSTF** | Shortest Seek Time First – selects request with minimum seek distance from current head. |
| **SCAN** | Elevator algorithm – sweeps from current position to the end of disk, then reverses direction. |
| **C-SCAN** | Circular SCAN – sweeps one direction, then jumps back to the start without servicing reverse. |
| **LOOK** | SCAN but stops at the last request in each direction (does not go to disk end). |
| **C-LOOK** | Circular LOOK – sweeps one direction to last request, then jumps to the first request. |

## Project Structure

The project follows a **simple single-file architecture** (no build tools, no frameworks):

- `index.html` – Main structure, input controls, canvas containers.
- `style.css` – Glassmorphism styling, tables, responsive layout, path visualization.
- `script.js` – All algorithms, simulation logic, Chart.js integration, playback controls, comparison mode.
- `README.md` – This documentation.

Open `index.html` in any modern browser to run the visualizer.

## Validation & Error Handling

- Empty or malformed request queues trigger error toasts.
- Negative cylinder numbers or requests exceeding disk size are rejected.
- Initial head position and disk size are validated (>=0 and >=1 respectively).
- All errors are displayed with a temporary toast message (no console-only errors).

## Development

No external dependencies except Chart.js (loaded via CDN). To extend:

- **Add a new algorithm:** write a function `newAlgorithm(requests, start, diskSize, direction)` and add it to the `runAlgorithm` switch.
- **Modify UI:** edit classes in `style.css` (follow glassmorphism conventions).
- **Add a new graph:** insert a `<canvas>` in `index.html` and a rendering function in `script.js`.

## Performance Notes

- Disk size is used primarily for validation (not for full array scans in SCAN/C-SCAN). For large disk sizes, algorithms run in O(n²) worst case (SSTF) or O(n log n) for sorting-based ones.
- Maximum request count is limited by browser performance; typical usage (50-100 requests) works smoothly.

## Credits

Original concept by Bitttu4 (Disk Scheduling Algorithm Graph Plotter).  
This enhanced version adds playback controls, comparison mode, additional algorithms, and improved visualizations.

## License

MIT – free for educational and personal use.
