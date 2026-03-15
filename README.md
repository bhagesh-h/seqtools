# SeqTools - FASTA/FASTQ Toolkit

A client-side bioinformatics toolkit for FASTA/FASTQ file processing, powered by **Rust + WebAssembly**. All operations run entirely in your browser - no data is uploaded to any server.

## Features

### Format & I/O
- FASTQ ↔ FASTA conversion
- Format validation
- Head/tail (subset sequences)

### Quality Control (FASTQ)
- Per-base Phred quality statistics with charts
- Filter reads by average quality
- Sliding window quality trimming
- Adapter/primer trimming

### Sequence Manipulation
- Reverse complement (DNA/RNA)
- DNA → RNA transcription
- 6-frame translation to protein
- Uppercase/lowercase conversion
- Non-standard base filtering
- Base substitution

### Search & Filtering
- Regex grep on ID/header
- Motif/pattern search in sequences
- Filter by length range
- Filter by GC content range

### Statistics
- Full sequence statistics (count, lengths, GC%, N50/N90)
- Length distribution charts
- Deduplication by ID or sequence

### Sampling & Splitting
- Random sampling
- Sequence shuffling
- File splitting into N chunks

### Merging & Set Operations
- Concatenate files
- Header renaming
- Sort by length or ID
- Intersect/union by ID

## Prerequisites

- [Rust](https://rustup.rs/) 1.70+
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

## Build

```bash
# Install wasm-pack if needed
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Build
./build.sh

# Serve locally
cd www && python3 -m http.server 8080
```

Open http://localhost:8080

## Architecture

```
bio-wasm-app/
├── Cargo.toml          # Rust dependencies
├── src/
│   └── lib.rs          # Rust bioinformatics engine (compiled to Wasm)
├── www/
│   ├── index.html      # App shell
│   ├── css/style.css   # Modern dark-themed UI
│   ├── js/app.js       # Frontend logic & Wasm interop
│   └── pkg/            # Generated Wasm artifacts (after build)
├── build.sh            # Build script
├── render.yaml         # Render.com deployment config
└── README.md
```

The Rust code in `src/lib.rs` implements a custom FASTA/FASTQ parser and all bioinformatics operations. It compiles to WebAssembly via `wasm-pack` and is called from JavaScript through `wasm-bindgen`.

## Author

[Bhagesh Hunakunti](https://www.linkedin.com/in/bhagesh-hunakunti/)