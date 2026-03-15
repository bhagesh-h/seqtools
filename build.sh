#!/bin/bash
set -e

echo "=== Building bio-wasm-app ==="

# Check for wasm-pack
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the Rust → Wasm package
echo "Compiling Rust to WebAssembly..."
wasm-pack build --target web --out-dir www/pkg --release

# Remove unnecessary files from pkg
rm -f www/pkg/.gitignore www/pkg/package.json www/pkg/README.md

echo ""
echo "=== Build complete ==="
echo "Serve the 'www' directory with any static file server."
echo "  Example: cd www && python3 -m http.server 8080"
echo ""
