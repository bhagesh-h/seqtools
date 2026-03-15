// ─── Task Definitions ───────────────────────────────────────────────────────

const TASKS = {
    convert: [
        { id: 'to_fasta',    label: 'FASTQ → FASTA',     desc: 'Strip quality scores', icon: '↔', params: [] },
        { id: 'to_fastq',    label: 'FASTA → FASTQ',     desc: 'Add dummy Q30 scores', icon: '↔', params: [] },
        { id: 'validate',    label: 'Validate Format',    desc: 'Check headers, bases, lengths', icon: '✓', params: [], resultType: 'json' },
        { id: 'head',        label: 'Head (First N)',     desc: 'Take first N sequences', icon: '⤒', params: [{ key: 'n', label: 'Number of sequences', type: 'number', default: 10, min: 1 }] },
        { id: 'tail',        label: 'Tail (Last N)',      desc: 'Take last N sequences', icon: '⤓', params: [{ key: 'n', label: 'Number of sequences', type: 'number', default: 10, min: 1 }] },
    ],
    qc: [
        { id: 'quality_stats',  label: 'Quality Stats',       desc: 'Per-base Phred min/mean/max', icon: '📊', params: [], fastqOnly: true, resultType: 'qc_stats' },
        { id: 'filter_quality', label: 'Filter by Quality',   desc: 'Keep reads with avg Q ≥ threshold', icon: '🔬', params: [{ key: 'min_q', label: 'Min avg quality (Phred)', type: 'number', default: 20, min: 0, max: 60 }], fastqOnly: true },
        { id: 'trim_quality',   label: 'Trim Low-Q Ends',     desc: 'Sliding window quality trim', icon: '✂', params: [{ key: 'min_q', label: 'Min quality', type: 'number', default: 20 }, { key: 'window', label: 'Window size', type: 'number', default: 4 }], fastqOnly: true },
        { id: 'trim_adapter',   label: 'Trim Adapter',        desc: 'Remove adapter sequence from 3\' end', icon: '🧹', params: [{ key: 'adapter', label: 'Adapter sequence', type: 'text', placeholder: 'AGATCGGAAGAG' }] },
    ],
    manipulate: [
        { id: 'reverse_complement', label: 'Reverse Complement', desc: 'DNA/RNA reverse complement', icon: '🔄', params: [] },
        { id: 'reverse_sequences',  label: 'Reverse',            desc: 'Reverse without complementing', icon: '⇋', params: [] },
        { id: 'transcribe',         label: 'Transcribe DNA→RNA', desc: 'Replace T with U', icon: '🧬', params: [] },
        { id: 'translate',          label: 'Translate (6 frames)', desc: 'DNA → protein all 6 reading frames', icon: '🔮', params: [], resultType: 'json' },
        { id: 'to_uppercase',       label: 'Uppercase',          desc: 'Convert all bases to uppercase', icon: 'Aa', params: [] },
        { id: 'to_lowercase',       label: 'Lowercase',          desc: 'Convert all bases to lowercase', icon: 'aa', params: [] },
        { id: 'filter_clean',       label: 'Filter Clean',       desc: 'Remove sequences with N, gaps, etc.', icon: '🧹', params: [] },
        { id: 'substitute_base',    label: 'Base Substitution',  desc: 'Replace one base with another', icon: '🔀', params: [{ key: 'from', label: 'From', type: 'text', placeholder: 'T' }, { key: 'to', label: 'To', type: 'text', placeholder: 'U' }] },
    ],
    search: [
        { id: 'grep_id',       label: 'Grep ID/Header',  desc: 'Filter by header regex', icon: '🔍', params: [{ key: 'pattern', label: 'Regex pattern', type: 'text', placeholder: 'chr[0-9]+' }] },
        { id: 'search_motif',  label: 'Motif Search',     desc: 'Find pattern matches in sequences', icon: '🎯', params: [{ key: 'pattern', label: 'Motif regex', type: 'text', placeholder: 'ATG[ACGT]{3}TAA' }], resultType: 'json' },
        { id: 'filter_length', label: 'Filter by Length', desc: 'Keep sequences in length range', icon: '📏', params: [{ key: 'min_len', label: 'Min length', type: 'number', default: 0 }, { key: 'max_len', label: 'Max length', type: 'number', default: 999999 }] },
        { id: 'filter_gc',     label: 'Filter by GC%',   desc: 'Keep sequences in GC content range', icon: '%', params: [{ key: 'min_pct', label: 'Min GC%', type: 'number', default: 0 }, { key: 'max_pct', label: 'Max GC%', type: 'number', default: 100 }] },
    ],
    stats: [
        { id: 'statistics',      label: 'Sequence Stats',     desc: 'Count, lengths, GC, N50/N90', icon: '📈', params: [], resultType: 'stats' },
        { id: 'deduplicate_seq', label: 'Deduplicate (Seq)',  desc: 'Remove duplicate sequences', icon: '🗑', params: [] },
        { id: 'deduplicate_id',  label: 'Deduplicate (ID)',   desc: 'Remove duplicate IDs', icon: '🗑', params: [] },
    ],
    sample: [
        { id: 'random_sample', label: 'Random Sample',  desc: 'Take N random sequences', icon: '🎲', params: [{ key: 'n', label: 'Sample size', type: 'number', default: 100 }] },
        { id: 'shuffle',       label: 'Shuffle',        desc: 'Randomize sequence order', icon: '🔀', params: [] },
        { id: 'split_file',    label: 'Split File',     desc: 'Split into N chunks', icon: '📂', params: [{ key: 'n', label: 'Number of chunks', type: 'number', default: 2, min: 2 }], resultType: 'json' },
    ],
    merge: [
        { id: 'rename_headers',  label: 'Rename Headers',    desc: 'Prefix + sequential numbering', icon: '✏', params: [{ key: 'prefix', label: 'ID prefix', type: 'text', placeholder: 'seq' }] },
        { id: 'sort_by_length',  label: 'Sort by Length',    desc: 'Sort sequences by length', icon: '↕', params: [{ key: 'ascending', label: 'Ascending', type: 'checkbox', default: true }] },
        { id: 'sort_by_id',      label: 'Sort by ID',       desc: 'Alphabetical sort by ID', icon: '🔤', params: [] },
        { id: 'concatenate',     label: 'Concatenate Files', desc: 'Merge with a second file', icon: '📎', params: [{ key: 'second_file', label: 'Second file', type: 'file' }] },
        { id: 'intersect_ids',   label: 'Intersect (by ID)', desc: 'IDs common to both files', icon: '∩', params: [{ key: 'second_file', label: 'Second file', type: 'file' }] },
        { id: 'union_ids',       label: 'Union (by ID)',     desc: 'All unique IDs from both files', icon: '∪', params: [{ key: 'second_file', label: 'Second file', type: 'file' }] },
    ],
};

// ─── State ──────────────────────────────────────────────────────────────────

let state = {
    processor: null,
    wasmModule: null,
    fileData: null,
    fileName: '',
    format: 'fasta',
    selectedTask: null,
    selectedCategory: 'convert',
    resultData: null,
    secondFileData: null,
    secondFileFormat: null,
    chartInstance: null,
};

// ─── Initialize ─────────────────────────────────────────────────────────────

async function init() {
    try {
        state.wasmModule = await import('../pkg/bio_wasm_app.js');
        await state.wasmModule.default();
        document.getElementById('loadingOverlay').hidden = true;
        setupEventListeners();
        renderTasks('convert');
    } catch (e) {
        document.querySelector('.loading-text').textContent = 'Failed to load Wasm module: ' + e.message;
        console.error('Wasm init failed:', e);
    }
}

// ─── Event Listeners ────────────────────────────────────────────────────────

function setupEventListeners() {
    // Format toggle
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.format = btn.dataset.format;
        });
    });

    // File upload
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', e => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    // Clear file
    document.getElementById('clearFile').addEventListener('click', clearFile);

    // Paste input
    document.getElementById('loadPaste').addEventListener('click', handlePaste);

    // Category tabs
    document.querySelectorAll('.cat-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.selectedCategory = tab.dataset.cat;
            renderTasks(tab.dataset.cat);
        });
    });

    // Run button
    document.getElementById('runBtn').addEventListener('click', runTask);

    // Result tabs
    document.querySelectorAll('.result-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.result-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            showResultView(tab.dataset.view);
        });
    });

    // Download
    document.getElementById('downloadBtn').addEventListener('click', downloadResult);

    // Copy
    document.getElementById('copyBtn').addEventListener('click', copyResult);
}

// ─── File Handling ──────────────────────────────────────────────────────────

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        state.fileData = e.target.result;
        state.fileName = file.name;

        // Auto-detect format
        const ext = file.name.toLowerCase();
        if (ext.includes('fastq') || ext.endsWith('.fq')) {
            state.format = 'fastq';
        } else {
            state.format = 'fasta';
        }
        document.querySelectorAll('.format-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.format === state.format);
        });

        // Create processor
        try {
            state.processor = new state.wasmModule.BioProcessor(state.fileData, state.format);
            showFileInfo(file);
            updateRunButton();
        } catch (err) {
            showStatus('Error parsing file: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

function handlePaste() {
    const text = document.getElementById('pasteInput').value.trim();
    if (!text) return;

    state.fileData = text;
    state.fileName = 'pasted_data.' + (state.format === 'fastq' ? 'fastq' : 'fasta');

    try {
        state.processor = new state.wasmModule.BioProcessor(state.fileData, state.format);
        showFileInfo({ name: state.fileName, size: text.length });
        updateRunButton();
    } catch (err) {
        showStatus('Error parsing pasted data: ' + err.message, 'error');
    }
}

function showFileInfo(file) {
    document.getElementById('uploadZone').hidden = true;
    document.getElementById('fileInfo').hidden = false;
    document.getElementById('fileName').textContent = state.fileName;

    const count = state.processor.record_count();
    const isFq = state.processor.is_fastq_format();
    document.getElementById('fileStats').innerHTML = `
        <span>Sequences: <strong>${count.toLocaleString()}</strong></span>
        <span>Format: <strong>${isFq ? 'FASTQ' : 'FASTA'}</strong></span>
        <span>Size: <strong>${formatBytes(file.size)}</strong></span>
    `;
}

function clearFile() {
    state.processor = null;
    state.fileData = null;
    state.fileName = '';
    state.secondFileData = null;
    document.getElementById('uploadZone').hidden = false;
    document.getElementById('fileInfo').hidden = true;
    document.getElementById('resultsPanel').hidden = true;
    document.getElementById('fileInput').value = '';
    updateRunButton();
}

// ─── Task Rendering ─────────────────────────────────────────────────────────

function renderTasks(category) {
    const list = document.getElementById('taskList');
    const tasks = TASKS[category] || [];
    state.selectedTask = null;
    updateRunButton();

    list.innerHTML = tasks.map(task => `
        <div class="task-item" data-task-id="${task.id}">
            <div class="task-icon">${task.icon}</div>
            <div>
                <div class="task-label">${task.label}</div>
                <div class="task-desc">${task.desc}</div>
            </div>
            ${task.fastqOnly ? '<span class="task-badge fastq-only">FASTQ</span>' : ''}
        </div>
    `).join('');

    list.querySelectorAll('.task-item').forEach(item => {
        item.addEventListener('click', () => selectTask(item.dataset.taskId, category));
    });
}

function selectTask(taskId, category) {
    // Deselect all
    document.querySelectorAll('.task-item').forEach(i => i.classList.remove('selected'));
    // Select this one
    const el = document.querySelector(`[data-task-id="${taskId}"]`);
    if (el) el.classList.add('selected');

    const tasks = TASKS[category];
    state.selectedTask = tasks.find(t => t.id === taskId);
    renderParams(state.selectedTask);
    updateRunButton();
}

function renderParams(task) {
    const section = document.getElementById('paramsSection');
    const form = document.getElementById('paramsForm');

    if (!task || task.params.length === 0) {
        section.hidden = true;
        return;
    }

    section.hidden = false;
    document.getElementById('paramsTitle').textContent = task.label + ' — Parameters';

    form.innerHTML = task.params.map(p => {
        if (p.type === 'file') {
            return `
                <div class="param-group">
                    <label class="param-label">${p.label}</label>
                    <div class="second-file-zone" id="secondFileZone">
                        <input type="file" id="secondFileInput" accept=".fasta,.fa,.fna,.fastq,.fq,.fas,.seq,.txt" hidden>
                        <span class="second-file-label" id="secondFileLabel">Click to select second file</span>
                    </div>
                </div>
            `;
        }
        if (p.type === 'checkbox') {
            return `
                <div class="param-group">
                    <label class="param-label" style="display:flex;align-items:center;gap:8px;">
                        <input type="checkbox" id="param_${p.key}" ${p.default ? 'checked' : ''}>
                        ${p.label}
                    </label>
                </div>
            `;
        }
        return `
            <div class="param-group">
                <label class="param-label" for="param_${p.key}">${p.label}</label>
                <input class="param-input" id="param_${p.key}" type="${p.type}" 
                    ${p.default !== undefined ? `value="${p.default}"` : ''}
                    ${p.min !== undefined ? `min="${p.min}"` : ''}
                    ${p.max !== undefined ? `max="${p.max}"` : ''}
                    ${p.placeholder ? `placeholder="${p.placeholder}"` : ''}>
                ${p.help ? `<span class="param-help">${p.help}</span>` : ''}
            </div>
        `;
    }).join('');

    // Second file handler
    const zone = document.getElementById('secondFileZone');
    const input = document.getElementById('secondFileInput');
    if (zone && input) {
        zone.addEventListener('click', () => input.click());
        input.addEventListener('change', e => {
            if (e.target.files.length) {
                const f = e.target.files[0];
                const reader = new FileReader();
                reader.onload = ev => {
                    state.secondFileData = ev.target.result;
                    const ext = f.name.toLowerCase();
                    state.secondFileFormat = (ext.includes('fastq') || ext.endsWith('.fq')) ? 'fastq' : 'fasta';
                    document.getElementById('secondFileLabel').textContent = f.name;
                };
                reader.readAsText(f);
            }
        });
    }
}

function getParams() {
    const params = {};
    if (!state.selectedTask) return params;
    for (const p of state.selectedTask.params) {
        if (p.type === 'file') continue;
        const el = document.getElementById(`param_${p.key}`);
        if (!el) continue;
        if (p.type === 'checkbox') {
            params[p.key] = el.checked;
        } else if (p.type === 'number') {
            params[p.key] = Number(el.value);
        } else {
            params[p.key] = el.value;
        }
    }
    return params;
}

// ─── Run Task ───────────────────────────────────────────────────────────────

function runTask() {
    if (!state.processor || !state.selectedTask) return;

    const task = state.selectedTask;
    const params = getParams();
    const t0 = performance.now();

    showStatus('Running...', '');

    try {
        let result;
        switch (task.id) {
            case 'to_fasta':          result = state.processor.to_fasta(); break;
            case 'to_fastq':          result = state.processor.to_fastq(); break;
            case 'validate':          result = state.processor.validate(); break;
            case 'head':              result = state.processor.head(params.n); break;
            case 'tail':              result = state.processor.tail(params.n); break;
            case 'quality_stats':     result = state.processor.quality_stats(); break;
            case 'filter_quality':    result = state.processor.filter_quality(params.min_q); break;
            case 'trim_quality':      result = state.processor.trim_quality(params.min_q, params.window); break;
            case 'trim_adapter':      result = state.processor.trim_adapter(params.adapter || ''); break;
            case 'reverse_complement': result = state.processor.reverse_complement(); break;
            case 'reverse_sequences': result = state.processor.reverse_sequences(); break;
            case 'transcribe':        result = state.processor.transcribe(); break;
            case 'translate':         result = state.processor.translate_six_frames(); break;
            case 'to_uppercase':      result = state.processor.to_uppercase(); break;
            case 'to_lowercase':      result = state.processor.to_lowercase(); break;
            case 'filter_clean':      result = state.processor.filter_clean(); break;
            case 'substitute_base':   result = state.processor.substitute_base(params.from || '', params.to || ''); break;
            case 'grep_id':           result = state.processor.grep_id(params.pattern || ''); break;
            case 'search_motif':      result = state.processor.search_motif(params.pattern || ''); break;
            case 'filter_length':     result = state.processor.filter_length(params.min_len, params.max_len); break;
            case 'filter_gc':         result = state.processor.filter_gc(params.min_pct, params.max_pct); break;
            case 'statistics':        result = state.processor.statistics(); break;
            case 'deduplicate_seq':   result = state.processor.deduplicate_seq(); break;
            case 'deduplicate_id':    result = state.processor.deduplicate_id(); break;
            case 'random_sample':     result = state.processor.random_sample(params.n); break;
            case 'shuffle':           result = state.processor.shuffle(); break;
            case 'split_file':        result = state.processor.split_file(params.n); break;
            case 'rename_headers':    result = state.processor.rename_headers(params.prefix || 'seq'); break;
            case 'sort_by_length':    result = state.processor.sort_by_length(params.ascending); break;
            case 'sort_by_id':        result = state.processor.sort_by_id(); break;
            case 'concatenate':
                if (!state.secondFileData) { showStatus('Please select a second file', 'error'); return; }
                result = state.processor.concatenate(state.secondFileData, state.secondFileFormat);
                break;
            case 'intersect_ids':
                if (!state.secondFileData) { showStatus('Please select a second file', 'error'); return; }
                result = state.processor.intersect_ids(state.secondFileData, state.secondFileFormat);
                break;
            case 'union_ids':
                if (!state.secondFileData) { showStatus('Please select a second file', 'error'); return; }
                result = state.processor.union_ids(state.secondFileData, state.secondFileFormat);
                break;
            default:
                showStatus('Task not implemented yet', 'error');
                return;
        }

        const elapsed = ((performance.now() - t0) / 1000).toFixed(3);
        state.resultData = result;
        displayResult(task, result);
        showStatus(`Completed in ${elapsed}s`, 'success');
    } catch (err) {
        showStatus('Error: ' + err.message, 'error');
        console.error(err);
    }
}

// ─── Display Results ────────────────────────────────────────────────────────

function displayResult(task, result) {
    const panel = document.getElementById('resultsPanel');
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const resultType = task.resultType || 'sequence';

    // Reset views
    document.querySelectorAll('.result-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('resultPreview').hidden = true;
    document.getElementById('resultTable').hidden = true;
    document.getElementById('resultChart').hidden = true;

    if (resultType === 'stats') {
        displayStats(result);
    } else if (resultType === 'qc_stats') {
        displayQcStats(result);
    } else if (resultType === 'json') {
        displayJson(result);
    } else {
        displaySequence(result);
    }
}

function displaySequence(result) {
    // Preview tab
    document.querySelector('[data-view="preview"]').classList.add('active');
    document.getElementById('resultPreview').hidden = false;

    const lines = result.split('\n');
    const truncated = lines.length > 500 ? lines.slice(0, 500).join('\n') + '\n\n... (truncated, download for full output)' : result;
    document.getElementById('resultCode').textContent = truncated;

    // Count sequences in result
    const seqCount = (result.match(/^>/gm) || result.match(/^@/gm) || []).length;
    document.getElementById('resultMeta').textContent = `${seqCount.toLocaleString()} sequences`;

    // Table view — parse result into records for table
    try {
        const tempProcessor = new state.wasmModule.BioProcessor(result, state.format);
        const json = tempProcessor.records_json();
        const records = JSON.parse(json);
        renderTable(records);
    } catch (e) {
        // Table not available for this result
    }
}

function displayStats(result) {
    document.querySelector('[data-view="preview"]').classList.add('active');
    document.getElementById('resultPreview').hidden = false;

    try {
        const stats = JSON.parse(result);
        const formatted = `
Sequence Statistics
═══════════════════════════════════════

  Total sequences:   ${stats.total_sequences.toLocaleString()}
  Total bases:       ${stats.total_bases.toLocaleString()}
  Min length:        ${stats.min_length.toLocaleString()}
  Max length:        ${stats.max_length.toLocaleString()}
  Avg length:        ${stats.avg_length.toFixed(1)}
  GC content:        ${stats.gc_content.toFixed(2)}%
  N50:               ${stats.n50.toLocaleString()}
  N90:               ${stats.n90.toLocaleString()}
`.trim();

        document.getElementById('resultCode').textContent = formatted;
        document.getElementById('resultMeta').textContent = `${stats.total_sequences} sequences analyzed`;

        // Chart: length distribution
        if (stats.lengths && stats.lengths.length > 0) {
            renderLengthChart(stats.lengths);
        }
    } catch (e) {
        document.getElementById('resultCode').textContent = result;
    }
}

function displayQcStats(result) {
    document.querySelector('[data-view="chart"]').classList.add('active');
    document.getElementById('resultChart').hidden = false;

    try {
        const stats = JSON.parse(result);
        const formatted = `
Quality Statistics (Phred+33)
═══════════════════════════════════════

  Reads analyzed:   ${stats.read_count.toLocaleString()}
  Overall mean Q:   ${stats.overall_mean.toFixed(1)}
  Overall min Q:    ${stats.overall_min}
  Overall max Q:    ${stats.overall_max}
  Read length:      up to ${stats.per_position_mean.length} bp
`.trim();

        document.getElementById('resultCode').textContent = formatted;
        document.getElementById('resultMeta').textContent = `${stats.read_count} reads`;

        renderQcChart(stats);
    } catch (e) {
        document.querySelector('[data-view="preview"]').classList.add('active');
        document.getElementById('resultPreview').hidden = false;
        document.getElementById('resultChart').hidden = true;
        document.getElementById('resultCode').textContent = result;
    }
}

function displayJson(result) {
    document.querySelector('[data-view="preview"]').classList.add('active');
    document.getElementById('resultPreview').hidden = false;

    try {
        const data = JSON.parse(result);
        document.getElementById('resultCode').textContent = JSON.stringify(data, null, 2);

        // If it's an array, try rendering as table
        if (Array.isArray(data) && data.length > 0) {
            renderJsonTable(data);
            document.getElementById('resultMeta').textContent = `${data.length} results`;
        }
    } catch (e) {
        document.getElementById('resultCode').textContent = result;
    }
}

// ─── Charts ─────────────────────────────────────────────────────────────────

function renderQcChart(stats) {
    const canvas = document.getElementById('chartCanvas');
    const ctx = canvas.getContext('2d');

    if (state.chartInstance) state.chartInstance.destroy();

    const labels = stats.per_position_mean.map((_, i) => i + 1);

    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Mean Quality',
                    data: stats.per_position_mean,
                    borderColor: '#58a6ff',
                    backgroundColor: 'rgba(88,166,255,0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    borderWidth: 2,
                },
                {
                    label: 'Min Quality',
                    data: stats.per_position_min,
                    borderColor: '#f8514966',
                    borderWidth: 1,
                    pointRadius: 0,
                    borderDash: [4, 4],
                },
                {
                    label: 'Max Quality',
                    data: stats.per_position_max,
                    borderColor: '#3fb95066',
                    borderWidth: 1,
                    pointRadius: 0,
                    borderDash: [4, 4],
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#8b949e', font: { family: 'General Sans' } } },
                title: { display: true, text: 'Per-Base Quality Score', color: '#e1e4e8', font: { family: 'General Sans', size: 14 } },
            },
            scales: {
                x: {
                    title: { display: true, text: 'Position (bp)', color: '#8b949e' },
                    ticks: { color: '#484f58', maxTicksLimit: 20 },
                    grid: { color: '#2a2e3440' },
                },
                y: {
                    title: { display: true, text: 'Phred Score', color: '#8b949e' },
                    ticks: { color: '#484f58' },
                    grid: { color: '#2a2e3440' },
                    min: 0,
                },
            },
        },
    });
}

function renderLengthChart(lengths) {
    const canvas = document.getElementById('chartCanvas');
    const ctx = canvas.getContext('2d');

    if (state.chartInstance) state.chartInstance.destroy();

    // Create histogram bins
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    const binCount = Math.min(50, Math.max(10, Math.ceil(Math.sqrt(lengths.length))));
    const binWidth = Math.max(1, Math.ceil((max - min + 1) / binCount));
    const bins = new Array(binCount).fill(0);
    const binLabels = [];

    for (let i = 0; i < binCount; i++) {
        const lo = min + i * binWidth;
        const hi = lo + binWidth - 1;
        binLabels.push(binWidth > 1 ? `${lo}-${hi}` : `${lo}`);
    }

    for (const l of lengths) {
        const idx = Math.min(Math.floor((l - min) / binWidth), binCount - 1);
        bins[idx]++;
    }

    state.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: binLabels,
            datasets: [{
                label: 'Count',
                data: bins,
                backgroundColor: 'rgba(88,166,255,0.6)',
                borderColor: '#58a6ff',
                borderWidth: 1,
                borderRadius: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Sequence Length Distribution', color: '#e1e4e8', font: { family: 'General Sans', size: 14 } },
            },
            scales: {
                x: {
                    title: { display: true, text: 'Length (bp)', color: '#8b949e' },
                    ticks: { color: '#484f58', maxRotation: 45, maxTicksLimit: 20 },
                    grid: { color: '#2a2e3440' },
                },
                y: {
                    title: { display: true, text: 'Count', color: '#8b949e' },
                    ticks: { color: '#484f58' },
                    grid: { color: '#2a2e3440' },
                },
            },
        },
    });
}

// ─── Table Rendering ────────────────────────────────────────────────────────

function renderTable(records) {
    if (!records.length) return;

    const head = document.getElementById('dataTableHead');
    const body = document.getElementById('dataTableBody');
    const keys = Object.keys(records[0]);

    head.innerHTML = `<tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr>`;
    body.innerHTML = records.slice(0, 200).map(rec =>
        `<tr>${keys.map(k => `<td>${rec[k] ?? ''}</td>`).join('')}</tr>`
    ).join('');
}

function renderJsonTable(data) {
    if (!data.length) return;

    const flat = data.map(item => {
        const row = {};
        for (const [k, v] of Object.entries(item)) {
            if (typeof v === 'object' && v !== null) {
                row[k] = JSON.stringify(v);
            } else {
                row[k] = v;
            }
        }
        return row;
    });
    renderTable(flat);
}

// ─── Result View Switching ──────────────────────────────────────────────────

function showResultView(view) {
    document.getElementById('resultPreview').hidden = view !== 'preview';
    document.getElementById('resultTable').hidden = view !== 'table';
    document.getElementById('resultChart').hidden = view !== 'chart';
}

// ─── Download & Copy ────────────────────────────────────────────────────────

function downloadResult() {
    if (!state.resultData) return;

    const ext = state.format === 'fastq' ? 'fastq' : 'fasta';
    let filename = `result_${state.selectedTask?.id || 'output'}.${ext}`;

    // JSON results get .json extension
    if (state.selectedTask?.resultType === 'json' || state.selectedTask?.resultType === 'stats' || state.selectedTask?.resultType === 'qc_stats') {
        filename = `result_${state.selectedTask.id}.json`;
    }

    const blob = new Blob([state.resultData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function copyResult() {
    if (!state.resultData) return;
    navigator.clipboard.writeText(state.resultData).then(() => {
        const btn = document.getElementById('copyBtn');
        const orig = btn.innerHTML;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied';
        setTimeout(() => btn.innerHTML = orig, 2000);
    });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function updateRunButton() {
    const btn = document.getElementById('runBtn');
    btn.disabled = !state.processor || !state.selectedTask;
}

function showStatus(text, type) {
    const el = document.getElementById('runStatus');
    el.textContent = text;
    el.className = 'run-status' + (type ? ' ' + type : '');
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ─── Start ──────────────────────────────────────────────────────────────────

init();
