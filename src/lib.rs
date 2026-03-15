use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use std::collections::HashSet;
use regex::Regex;

// ─── Record Types ───────────────────────────────────────────────────────────

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Record {
    pub id: String,
    pub desc: String,
    pub seq: String,
    pub qual: String, // empty for FASTA
}

#[derive(Serialize, Deserialize)]
pub struct Stats {
    pub total_sequences: usize,
    pub total_bases: usize,
    pub min_length: usize,
    pub max_length: usize,
    pub avg_length: f64,
    pub gc_content: f64,
    pub n50: usize,
    pub n90: usize,
    pub lengths: Vec<usize>,
    pub gc_per_seq: Vec<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct QualityStats {
    pub per_position_mean: Vec<f64>,
    pub per_position_min: Vec<u8>,
    pub per_position_max: Vec<u8>,
    pub overall_mean: f64,
    pub overall_min: u8,
    pub overall_max: u8,
    pub read_count: usize,
}

#[derive(Serialize, Deserialize)]
pub struct MotifHit {
    pub seq_id: String,
    pub start: usize,
    pub end: usize,
    pub matched: String,
}

#[derive(Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

// ─── Codon Table ────────────────────────────────────────────────────────────

fn codon_to_aa(codon: &str) -> char {
    match codon.to_uppercase().as_str() {
        "TTT" | "TTC" => 'F',
        "TTA" | "TTG" | "CTT" | "CTC" | "CTA" | "CTG" => 'L',
        "ATT" | "ATC" | "ATA" => 'I',
        "ATG" => 'M',
        "GTT" | "GTC" | "GTA" | "GTG" => 'V',
        "TCT" | "TCC" | "TCA" | "TCG" | "AGT" | "AGC" => 'S',
        "CCT" | "CCC" | "CCA" | "CCG" => 'P',
        "ACT" | "ACC" | "ACA" | "ACG" => 'T',
        "GCT" | "GCC" | "GCA" | "GCG" => 'A',
        "TAT" | "TAC" => 'Y',
        "TAA" | "TAG" | "TGA" => '*', // Stop
        "CAT" | "CAC" => 'H',
        "CAA" | "CAG" => 'Q',
        "AAT" | "AAC" => 'N',
        "AAA" | "AAG" => 'K',
        "GAT" | "GAC" => 'D',
        "GAA" | "GAG" => 'E',
        "TGT" | "TGC" => 'C',
        "TGG" => 'W',
        "CGT" | "CGC" | "CGA" | "CGG" | "AGA" | "AGG" => 'R',
        "GGT" | "GGC" | "GGA" | "GGG" => 'G',
        _ => 'X',
    }
}

// ─── Parser ─────────────────────────────────────────────────────────────────

fn parse_fasta(data: &str) -> Vec<Record> {
    let mut records = Vec::new();
    let mut current_id = String::new();
    let mut current_desc = String::new();
    let mut current_seq = String::new();

    for line in data.lines() {
        let line = line.trim();
        if line.is_empty() { continue; }
        if line.starts_with('>') {
            if !current_id.is_empty() || !current_seq.is_empty() {
                records.push(Record {
                    id: current_id.clone(),
                    desc: current_desc.clone(),
                    seq: current_seq.clone(),
                    qual: String::new(),
                });
            }
            let header = &line[1..];
            let parts: Vec<&str> = header.splitn(2, |c: char| c.is_whitespace()).collect();
            current_id = parts.first().unwrap_or(&"").to_string();
            current_desc = if parts.len() > 1 { parts[1].to_string() } else { String::new() };
            current_seq = String::new();
        } else {
            current_seq.push_str(line);
        }
    }
    if !current_id.is_empty() || !current_seq.is_empty() {
        records.push(Record {
            id: current_id,
            desc: current_desc,
            seq: current_seq,
            qual: String::new(),
        });
    }
    records
}

fn parse_fastq(data: &str) -> Vec<Record> {
    let mut records = Vec::new();
    let lines: Vec<&str> = data.lines().collect();
    let mut i = 0;

    while i < lines.len() {
        let line = lines[i].trim();
        if line.is_empty() { i += 1; continue; }

        if line.starts_with('@') && i + 3 < lines.len() {
            let header = &line[1..];
            let parts: Vec<&str> = header.splitn(2, |c: char| c.is_whitespace()).collect();
            let id = parts.first().unwrap_or(&"").to_string();
            let desc = if parts.len() > 1 { parts[1].to_string() } else { String::new() };

            let seq = lines[i + 1].trim().to_string();
            // lines[i+2] is '+' separator
            let qual = lines[i + 3].trim().to_string();

            records.push(Record { id, desc, seq, qual });
            i += 4;
        } else {
            i += 1;
        }
    }
    records
}

fn records_to_fasta(records: &[Record]) -> String {
    let mut out = String::new();
    for rec in records {
        out.push('>');
        out.push_str(&rec.id);
        if !rec.desc.is_empty() {
            out.push(' ');
            out.push_str(&rec.desc);
        }
        out.push('\n');
        // Wrap at 80 chars
        for chunk in rec.seq.as_bytes().chunks(80) {
            out.push_str(std::str::from_utf8(chunk).unwrap_or(""));
            out.push('\n');
        }
    }
    out
}

fn records_to_fastq(records: &[Record]) -> String {
    let mut out = String::new();
    for rec in records {
        out.push('@');
        out.push_str(&rec.id);
        if !rec.desc.is_empty() {
            out.push(' ');
            out.push_str(&rec.desc);
        }
        out.push('\n');
        out.push_str(&rec.seq);
        out.push_str("\n+\n");
        if rec.qual.is_empty() {
            // Dummy quality (Phred 30 = '?')
            let dummy: String = std::iter::repeat('?').take(rec.seq.len()).collect();
            out.push_str(&dummy);
        } else {
            out.push_str(&rec.qual);
        }
        out.push('\n');
    }
    out
}

// ─── Main Processor (Wasm-bound) ───────────────────────────────────────────

#[wasm_bindgen]
pub struct BioProcessor {
    records: Vec<Record>,
    is_fastq: bool,
}

#[wasm_bindgen]
impl BioProcessor {
    /// Parse input data. `format` = "fasta" or "fastq"
    #[wasm_bindgen(constructor)]
    pub fn new(data: &str, format: &str) -> BioProcessor {
        let is_fastq = format.to_lowercase().contains("fastq") || format.to_lowercase().contains("fq");
        let records = if is_fastq {
            parse_fastq(data)
        } else {
            parse_fasta(data)
        };
        BioProcessor { records, is_fastq }
    }

    pub fn record_count(&self) -> usize {
        self.records.len()
    }

    pub fn is_fastq_format(&self) -> bool {
        self.is_fastq
    }

    // ── Format Conversion ───────────────────────────────────────────────

    /// Convert FASTQ → FASTA (strip qualities)
    pub fn to_fasta(&self) -> String {
        records_to_fasta(&self.records)
    }

    /// Convert FASTA → FASTQ (add dummy qualities Q=30)
    pub fn to_fastq(&self) -> String {
        records_to_fastq(&self.records)
    }

    // ── Validation ──────────────────────────────────────────────────────

    pub fn validate(&self) -> String {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();
        let valid_bases: HashSet<char> = "ACGTUNacgtun.-".chars().collect();

        for (i, rec) in self.records.iter().enumerate() {
            if rec.id.is_empty() {
                errors.push(format!("Record {} has empty ID", i + 1));
            }
            if rec.seq.is_empty() {
                errors.push(format!("Record '{}' has empty sequence", rec.id));
            }
            for (j, ch) in rec.seq.chars().enumerate() {
                if !valid_bases.contains(&ch) {
                    warnings.push(format!("Record '{}' pos {}: non-standard base '{}'", rec.id, j + 1, ch));
                    break; // Only first per record
                }
            }
            if self.is_fastq && !rec.qual.is_empty() && rec.qual.len() != rec.seq.len() {
                errors.push(format!("Record '{}': quality length ({}) != sequence length ({})", rec.id, rec.qual.len(), rec.seq.len()));
            }
        }

        let result = ValidationResult {
            valid: errors.is_empty(),
            errors,
            warnings,
        };
        serde_json::to_string(&result).unwrap_or_default()
    }

    // ── Subset ──────────────────────────────────────────────────────────

    /// Head: first N sequences
    pub fn head(&self, n: usize) -> String {
        let subset: Vec<Record> = self.records.iter().take(n).cloned().collect();
        if self.is_fastq { records_to_fastq(&subset) } else { records_to_fasta(&subset) }
    }

    /// Tail: last N sequences
    pub fn tail(&self, n: usize) -> String {
        let start = if self.records.len() > n { self.records.len() - n } else { 0 };
        let subset: Vec<Record> = self.records[start..].to_vec();
        if self.is_fastq { records_to_fastq(&subset) } else { records_to_fasta(&subset) }
    }

    // ── Quality Control (FASTQ) ─────────────────────────────────────────

    pub fn quality_stats(&self) -> String {
        if !self.is_fastq || self.records.is_empty() {
            return "{}".to_string();
        }

        let max_len = self.records.iter().map(|r| r.qual.len()).max().unwrap_or(0);
        let mut pos_sums: Vec<f64> = vec![0.0; max_len];
        let mut pos_counts: Vec<usize> = vec![0; max_len];
        let mut pos_min: Vec<u8> = vec![255; max_len];
        let mut pos_max: Vec<u8> = vec![0; max_len];
        let mut overall_sum: f64 = 0.0;
        let mut overall_count: usize = 0;
        let mut overall_min: u8 = 255;
        let mut overall_max: u8 = 0;

        for rec in &self.records {
            for (i, &qb) in rec.qual.as_bytes().iter().enumerate() {
                let q = qb.saturating_sub(33); // Phred+33
                pos_sums[i] += q as f64;
                pos_counts[i] += 1;
                if q < pos_min[i] { pos_min[i] = q; }
                if q > pos_max[i] { pos_max[i] = q; }
                overall_sum += q as f64;
                overall_count += 1;
                if q < overall_min { overall_min = q; }
                if q > overall_max { overall_max = q; }
            }
        }

        let per_position_mean: Vec<f64> = pos_sums.iter().zip(pos_counts.iter())
            .map(|(&s, &c)| if c > 0 { s / c as f64 } else { 0.0 })
            .collect();
        let per_position_min: Vec<u8> = pos_min.iter().enumerate()
            .map(|(i, &v)| if pos_counts[i] > 0 { v } else { 0 })
            .collect();
        let per_position_max: Vec<u8> = pos_max.iter().enumerate()
            .map(|(i, &v)| if pos_counts[i] > 0 { v } else { 0 })
            .collect();

        let stats = QualityStats {
            per_position_mean,
            per_position_min,
            per_position_max,
            overall_mean: if overall_count > 0 { overall_sum / overall_count as f64 } else { 0.0 },
            overall_min: if overall_min == 255 { 0 } else { overall_min },
            overall_max,
            read_count: self.records.len(),
        };
        serde_json::to_string(&stats).unwrap_or_default()
    }

    /// Filter reads by average quality >= threshold
    pub fn filter_quality(&self, min_avg_q: u8) -> String {
        let filtered: Vec<Record> = self.records.iter().filter(|rec| {
            if rec.qual.is_empty() { return true; }
            let avg: f64 = rec.qual.bytes().map(|b| (b.saturating_sub(33)) as f64).sum::<f64>() / rec.qual.len() as f64;
            avg >= min_avg_q as f64
        }).cloned().collect();
        if self.is_fastq { records_to_fastq(&filtered) } else { records_to_fasta(&filtered) }
    }

    /// Trim low-quality ends (sliding window)
    pub fn trim_quality(&self, min_q: u8, window_size: usize) -> String {
        let mut trimmed: Vec<Record> = Vec::new();
        for rec in &self.records {
            if rec.qual.is_empty() {
                trimmed.push(rec.clone());
                continue;
            }
            let quals: Vec<u8> = rec.qual.bytes().map(|b| b.saturating_sub(33)).collect();
            let ws = window_size.max(1).min(quals.len());

            // Trim from 3' end
            let mut end = quals.len();
            if quals.len() >= ws {
                for i in (0..=quals.len() - ws).rev() {
                    let avg: f64 = quals[i..i + ws].iter().map(|&q| q as f64).sum::<f64>() / ws as f64;
                    if avg >= min_q as f64 {
                        end = i + ws;
                        break;
                    }
                    end = i;
                }
            }

            // Trim from 5' end
            let mut start = 0;
            if end > ws {
                for i in 0..=end - ws {
                    let avg: f64 = quals[i..i + ws].iter().map(|&q| q as f64).sum::<f64>() / ws as f64;
                    if avg >= min_q as f64 {
                        start = i;
                        break;
                    }
                }
            }

            if start < end {
                trimmed.push(Record {
                    id: rec.id.clone(),
                    desc: rec.desc.clone(),
                    seq: rec.seq[start..end].to_string(),
                    qual: rec.qual[start..end].to_string(),
                });
            }
        }
        if self.is_fastq { records_to_fastq(&trimmed) } else { records_to_fasta(&trimmed) }
    }

    /// Adapter trimming — remove adapter sequence from 3' end
    pub fn trim_adapter(&self, adapter: &str) -> String {
        let adapter_upper = adapter.to_uppercase();
        let mut result: Vec<Record> = Vec::new();
        for rec in &self.records {
            let seq_upper = rec.seq.to_uppercase();
            if let Some(pos) = seq_upper.find(&adapter_upper) {
                result.push(Record {
                    id: rec.id.clone(),
                    desc: rec.desc.clone(),
                    seq: rec.seq[..pos].to_string(),
                    qual: if rec.qual.is_empty() { String::new() } else { rec.qual[..pos].to_string() },
                });
            } else {
                result.push(rec.clone());
            }
        }
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    // ── Sequence Manipulation ───────────────────────────────────────────

    /// Reverse complement all sequences
    pub fn reverse_complement(&self) -> String {
        let mut result: Vec<Record> = Vec::new();
        for rec in &self.records {
            let rc: String = rec.seq.chars().rev().map(|c| match c {
                'A' => 'T', 'a' => 't',
                'T' => 'A', 't' => 'a',
                'G' => 'C', 'g' => 'c',
                'C' => 'G', 'c' => 'g',
                'U' => 'A', 'u' => 'a',
                _ => c,
            }).collect();
            let qual_rev: String = rec.qual.chars().rev().collect();
            result.push(Record { id: rec.id.clone(), desc: rec.desc.clone(), seq: rc, qual: qual_rev });
        }
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Reverse sequences (without complementing)
    pub fn reverse_sequences(&self) -> String {
        let mut result: Vec<Record> = Vec::new();
        for rec in &self.records {
            result.push(Record {
                id: rec.id.clone(),
                desc: rec.desc.clone(),
                seq: rec.seq.chars().rev().collect(),
                qual: rec.qual.chars().rev().collect(),
            });
        }
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Transcribe DNA → RNA
    pub fn transcribe(&self) -> String {
        let result: Vec<Record> = self.records.iter().map(|rec| {
            Record {
                id: rec.id.clone(),
                desc: rec.desc.clone(),
                seq: rec.seq.replace('T', "U").replace('t', "u"),
                qual: rec.qual.clone(),
            }
        }).collect();
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Translate DNA → protein (6 frames). Returns JSON array of frame results.
    pub fn translate_six_frames(&self) -> String {
        let mut all_results: Vec<serde_json::Value> = Vec::new();

        for rec in &self.records {
            let dna = rec.seq.replace('U', "T").replace('u', "t");
            let rc: String = dna.chars().rev().map(|c| match c {
                'A' | 'a' => 'T',
                'T' | 't' => 'A',
                'G' | 'g' => 'C',
                'C' | 'c' => 'G',
                _ => 'N',
            }).collect();

            let mut frames = Vec::new();
            let frame_defs: Vec<(&str, &str, usize)> = vec![
                ("5'→3' +1", &dna, 0), ("5'→3' +2", &dna, 1), ("5'→3' +3", &dna, 2),
                ("3'→5' +1", &rc, 0),  ("3'→5' +2", &rc, 1),  ("3'→5' +3", &rc, 2),
            ];
            for (label, seq, offset) in frame_defs {
                if offset >= seq.len() { continue; }
                let protein: String = seq[offset..].as_bytes()
                    .chunks(3)
                    .filter(|c: &&[u8]| c.len() == 3)
                    .map(|c| {
                        let codon = std::str::from_utf8(c).unwrap_or("NNN").to_uppercase();
                        codon_to_aa(&codon)
                    })
                    .collect();
                frames.push(serde_json::json!({ "frame": label, "protein": protein }));
            }
            all_results.push(serde_json::json!({
                "id": rec.id,
                "frames": frames
            }));
        }
        serde_json::to_string(&all_results).unwrap_or_default()
    }

    /// Convert to uppercase
    pub fn to_uppercase(&self) -> String {
        let result: Vec<Record> = self.records.iter().map(|rec| {
            Record { id: rec.id.clone(), desc: rec.desc.clone(), seq: rec.seq.to_uppercase(), qual: rec.qual.clone() }
        }).collect();
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Convert to lowercase
    pub fn to_lowercase(&self) -> String {
        let result: Vec<Record> = self.records.iter().map(|rec| {
            Record { id: rec.id.clone(), desc: rec.desc.clone(), seq: rec.seq.to_lowercase(), qual: rec.qual.clone() }
        }).collect();
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Filter out sequences with non-standard bases (N, gaps, etc.)
    pub fn filter_clean(&self) -> String {
        let valid: HashSet<char> = "ACGTUacgtu".chars().collect();
        let result: Vec<Record> = self.records.iter().filter(|rec| {
            rec.seq.chars().all(|c| valid.contains(&c))
        }).cloned().collect();
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Base substitution: replace `from` with `to` in all sequences
    pub fn substitute_base(&self, from: &str, to: &str) -> String {
        let result: Vec<Record> = self.records.iter().map(|rec| {
            Record { id: rec.id.clone(), desc: rec.desc.clone(), seq: rec.seq.replace(from, to), qual: rec.qual.clone() }
        }).collect();
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    // ── Search & Filtering ──────────────────────────────────────────────

    /// Grep by ID/header (regex)
    pub fn grep_id(&self, pattern: &str) -> String {
        let re = match Regex::new(pattern) {
            Ok(r) => r,
            Err(_) => return "Error: Invalid regex pattern".to_string(),
        };
        let result: Vec<Record> = self.records.iter().filter(|rec| {
            re.is_match(&rec.id) || re.is_match(&rec.desc)
        }).cloned().collect();
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Motif/pattern search in sequences → returns JSON hits
    pub fn search_motif(&self, pattern: &str) -> String {
        let re = match Regex::new(pattern) {
            Ok(r) => r,
            Err(_) => return "Error: Invalid regex pattern".to_string(),
        };
        let mut hits: Vec<MotifHit> = Vec::new();
        for rec in &self.records {
            for mat in re.find_iter(&rec.seq) {
                hits.push(MotifHit {
                    seq_id: rec.id.clone(),
                    start: mat.start(),
                    end: mat.end(),
                    matched: mat.as_str().to_string(),
                });
            }
        }
        serde_json::to_string(&hits).unwrap_or_default()
    }

    /// Filter by sequence length
    pub fn filter_length(&self, min_len: usize, max_len: usize) -> String {
        let result: Vec<Record> = self.records.iter().filter(|rec| {
            rec.seq.len() >= min_len && rec.seq.len() <= max_len
        }).cloned().collect();
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Filter by GC content (percentage: 0-100)
    pub fn filter_gc(&self, min_pct: f64, max_pct: f64) -> String {
        let result: Vec<Record> = self.records.iter().filter(|rec| {
            if rec.seq.is_empty() { return false; }
            let gc = rec.seq.chars().filter(|&c| matches!(c, 'G' | 'C' | 'g' | 'c')).count();
            let pct = (gc as f64 / rec.seq.len() as f64) * 100.0;
            pct >= min_pct && pct <= max_pct
        }).cloned().collect();
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    // ── Statistics ──────────────────────────────────────────────────────

    pub fn statistics(&self) -> String {
        if self.records.is_empty() {
            return "{}".to_string();
        }

        let mut lengths: Vec<usize> = self.records.iter().map(|r| r.seq.len()).collect();
        let total_bases: usize = lengths.iter().sum();
        let total_gc: usize = self.records.iter()
            .map(|r| r.seq.chars().filter(|&c| matches!(c, 'G' | 'C' | 'g' | 'c')).count())
            .sum();

        let gc_per_seq: Vec<f64> = self.records.iter().map(|r| {
            if r.seq.is_empty() { 0.0 } else {
                let gc = r.seq.chars().filter(|&c| matches!(c, 'G' | 'C' | 'g' | 'c')).count();
                (gc as f64 / r.seq.len() as f64) * 100.0
            }
        }).collect();

        lengths.sort_unstable_by(|a, b| b.cmp(a)); // descending
        let min_len = *lengths.last().unwrap_or(&0);
        let max_len = *lengths.first().unwrap_or(&0);

        // N50 & N90
        let half = total_bases as f64 * 0.5;
        let ninety = total_bases as f64 * 0.9;
        let mut cumulative = 0usize;
        let mut n50 = 0usize;
        let mut n90 = 0usize;
        for &l in &lengths {
            cumulative += l;
            if n50 == 0 && cumulative as f64 >= half { n50 = l; }
            if n90 == 0 && cumulative as f64 >= ninety { n90 = l; }
        }

        let stats = Stats {
            total_sequences: self.records.len(),
            total_bases,
            min_length: min_len,
            max_length: max_len,
            avg_length: total_bases as f64 / self.records.len() as f64,
            gc_content: if total_bases > 0 { (total_gc as f64 / total_bases as f64) * 100.0 } else { 0.0 },
            n50,
            n90,
            lengths: {
                let mut l = lengths.clone();
                l.sort_unstable();
                l
            },
            gc_per_seq,
        };
        serde_json::to_string(&stats).unwrap_or_default()
    }

    /// Deduplicate by sequence
    pub fn deduplicate_seq(&self) -> String {
        let mut seen = HashSet::new();
        let result: Vec<Record> = self.records.iter().filter(|rec| {
            seen.insert(rec.seq.to_uppercase())
        }).cloned().collect();
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Deduplicate by ID
    pub fn deduplicate_id(&self) -> String {
        let mut seen = HashSet::new();
        let result: Vec<Record> = self.records.iter().filter(|rec| {
            seen.insert(rec.id.clone())
        }).cloned().collect();
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    // ── Sampling & Splitting ────────────────────────────────────────────

    /// Random sample: take N sequences randomly
    pub fn random_sample(&self, n: usize) -> String {
        use rand::seq::SliceRandom;
        let mut rng = rand::thread_rng();
        let mut indices: Vec<usize> = (0..self.records.len()).collect();
        indices.shuffle(&mut rng);
        let take = n.min(self.records.len());
        let result: Vec<Record> = indices[..take].iter().map(|&i| self.records[i].clone()).collect();
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Shuffle sequences order
    pub fn shuffle(&self) -> String {
        use rand::seq::SliceRandom;
        let mut rng = rand::thread_rng();
        let mut result = self.records.clone();
        result.shuffle(&mut rng);
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Split into N chunks → returns JSON array of strings
    pub fn split_file(&self, num_chunks: usize) -> String {
        let chunks: usize = num_chunks.max(1).min(self.records.len());
        let chunk_size = (self.records.len() + chunks - 1) / chunks;
        let result: Vec<String> = self.records.chunks(chunk_size).map(|chunk| {
            if self.is_fastq { records_to_fastq(chunk) } else { records_to_fasta(chunk) }
        }).collect();
        serde_json::to_string(&result).unwrap_or_default()
    }

    // ── Merging & Sets ──────────────────────────────────────────────────

    /// Rename headers with prefix + index
    pub fn rename_headers(&self, prefix: &str) -> String {
        let result: Vec<Record> = self.records.iter().enumerate().map(|(i, rec)| {
            Record {
                id: format!("{}_{}", prefix, i + 1),
                desc: rec.desc.clone(),
                seq: rec.seq.clone(),
                qual: rec.qual.clone(),
            }
        }).collect();
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Sort by sequence length (ascending)
    pub fn sort_by_length(&self, ascending: bool) -> String {
        let mut result = self.records.clone();
        if ascending {
            result.sort_by_key(|r| r.seq.len());
        } else {
            result.sort_by(|a, b| b.seq.len().cmp(&a.seq.len()));
        }
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Sort by ID alphabetically
    pub fn sort_by_id(&self) -> String {
        let mut result = self.records.clone();
        result.sort_by(|a, b| a.id.cmp(&b.id));
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    // ── Concatenate (static, takes second file data) ────────────────────

    pub fn concatenate(&self, other_data: &str, other_format: &str) -> String {
        let is_fq = other_format.to_lowercase().contains("fastq") || other_format.to_lowercase().contains("fq");
        let other_records = if is_fq { parse_fastq(other_data) } else { parse_fasta(other_data) };
        let mut all = self.records.clone();
        all.extend(other_records);
        if self.is_fastq { records_to_fastq(&all) } else { records_to_fasta(&all) }
    }

    /// Intersect by ID with another file
    pub fn intersect_ids(&self, other_data: &str, other_format: &str) -> String {
        let is_fq = other_format.to_lowercase().contains("fastq") || other_format.to_lowercase().contains("fq");
        let other_records = if is_fq { parse_fastq(other_data) } else { parse_fasta(other_data) };
        let other_ids: HashSet<String> = other_records.iter().map(|r| r.id.clone()).collect();
        let result: Vec<Record> = self.records.iter().filter(|r| other_ids.contains(&r.id)).cloned().collect();
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Union by ID with another file
    pub fn union_ids(&self, other_data: &str, other_format: &str) -> String {
        let is_fq = other_format.to_lowercase().contains("fastq") || other_format.to_lowercase().contains("fq");
        let other_records = if is_fq { parse_fastq(other_data) } else { parse_fasta(other_data) };
        let mut seen: HashSet<String> = HashSet::new();
        let mut result: Vec<Record> = Vec::new();
        for rec in self.records.iter().chain(other_records.iter()) {
            if seen.insert(rec.id.clone()) {
                result.push(rec.clone());
            }
        }
        if self.is_fastq { records_to_fastq(&result) } else { records_to_fasta(&result) }
    }

    /// Get preview: first N records as formatted text
    pub fn preview(&self, n: usize) -> String {
        let subset: Vec<Record> = self.records.iter().take(n).cloned().collect();
        if self.is_fastq { records_to_fastq(&subset) } else { records_to_fasta(&subset) }
    }

    /// Get records as JSON (for table display)
    pub fn records_json(&self) -> String {
        let summaries: Vec<serde_json::Value> = self.records.iter().map(|rec| {
            let gc = if rec.seq.is_empty() { 0.0 } else {
                let gc = rec.seq.chars().filter(|&c| matches!(c, 'G' | 'C' | 'g' | 'c')).count();
                (gc as f64 / rec.seq.len() as f64) * 100.0
            };
            serde_json::json!({
                "id": rec.id,
                "desc": rec.desc,
                "length": rec.seq.len(),
                "gc": format!("{:.1}", gc),
                "seq_preview": if rec.seq.len() > 60 { format!("{}...", &rec.seq[..60]) } else { rec.seq.clone() },
            })
        }).collect();
        serde_json::to_string(&summaries).unwrap_or_default()
    }
}
