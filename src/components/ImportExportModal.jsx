import React, { useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, File, Sparkles, FolderArchive } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function ImportExportModal({ onClose, allTags, onImportData }) {
  const [importStatus, setImportStatus] = useState(null);
  const [autoSequence, setAutoSequence] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // 1. Export Excel File (.xlsx)
  const handleExportExcel = () => {
    const exportData = allTags.map((t) => ({
      'លេខស្លាក (Tag Number)': t.tagNumber,
      'ឈ្មោះ (Name)': t.name,
      'ទីតាំង (Location)': t.location,
      'លេខទូរស័ព្ទ (Phone)': t.phone || '',
      'កំណត់សម្គាល់ (Notes)': t.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'បញ្ជីស្លាកលេខ');
    XLSX.writeFile(workbook, `បញ្ជីស្លាកលេខ_TagList_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // 2. Export CSV File (.csv)
  const handleExportCSV = () => {
    const exportData = allTags.map((t) => ({
      tagNumber: t.tagNumber,
      name: t.name,
      location: t.location,
      phone: t.phone || '',
      notes: t.notes || ''
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Khmer UTF-8
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `បញ្ជីស្លាកលេខ_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Smart Khmer Excel, CSV, DOC, PDF & Universal Document parser
  const parseKhmerRowsToTags = (rawRows, forceAutoSeq = true) => {
    if (!Array.isArray(rawRows) || rawRows.length === 0) return [];

    const isHeaderOrFooter = (str) => {
      if (!str) return true;
      const s = String(str).trim().toLowerCase();
      return (
        s.includes('គោត') ||
        s.includes('គោត្ត') ||
        s.includes('បញ្ជី') ||
        s.includes('សម្រាប់') ||
        s.includes('សរុប') ||
        s.includes('total') ||
        s.includes('summary') ||
        s.includes('លេខរៀង') ||
        s.includes('ស្លាកលេខ') ||
        s.includes('លេខទូរស័ព្ទ') ||
        s === 'ឈ្មោះ' ||
        s === 'name' ||
        s === 'ល.រ' ||
        s === 'លរ' ||
        s === 'ភេទ' ||
        s === 'gender'
      );
    };

    const validTags = [];
    let seqNumber = 1;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!Array.isArray(row) || row.length === 0) continue;

      // Convert row cells to trimmed strings
      let cells = row.map((cell) => String(cell || '').trim()).filter(Boolean);
      if (cells.length === 0) continue;

      // If single cell string containing tab/comma/pipe/semicolon, split into cells
      if (cells.length === 1 && (cells[0].includes('\t') || cells[0].includes(',') || cells[0].includes('|') || cells[0].includes(';'))) {
        const parts = cells[0].split(/[\t,;|]/).map((s) => s.trim()).filter(Boolean);
        if (parts.length > 1) cells = parts;
      }

      let nameVal = '';
      let phoneVal = '';
      let vehicleTagVal = '';
      let locVal = '';
      let notesVal = '';
      let tagNumFromRow = null;

      // Scan all cells in the current row
      for (const cell of cells) {
        if (isHeaderOrFooter(cell)) continue;

        const lower = cell.toLowerCase();

        // Check if phone number (8 to 11 digits)
        const digitsOnly = cell.replace(/[^0-9]/g, '');
        if (digitsOnly.length >= 8 && digitsOnly.length <= 11 && (cell.startsWith('0') || cell.startsWith('+') || cell.startsWith('855') || cell.includes(' '))) {
          if (!phoneVal) phoneVal = cell;
          continue;
        }

        // Check if vehicle tag (contains pattern like 1EY-2579, 1GH-9279, 2A-3615 or province names)
        if (/\d[A-Z]{1,2}[-\s]?\d{3,4}/i.test(cell) || lower.includes('ភ្នំពេញ') || lower.includes('កណ្ដាល') || lower.includes('សៀមរាប') || lower.includes('បាត់ដំបង')) {
          if (!vehicleTagVal) vehicleTagVal = cell;
          continue;
        }

        // Check if location (contains កុដិ, អាគារ, ធម្មសាលា, វត្ត)
        if (lower.includes('កុដិ') || lower.includes('អាគារ') || lower.includes('ធម្មសាលា') || lower.includes('វត្ត')) {
          if (!locVal) locVal = cell;
          continue;
        }

        // Check numeric tag number from row if explicit sequence disabled
        if (!isNaN(Number(cell)) && Number(cell) > 0 && Number(cell) < 10000 && !tagNumFromRow) {
          tagNumFromRow = Number(cell);
        }

        // Check if person name: Contains Khmer characters, not purely numbers, not gender (ប្រុស/ស្រី)
        if (/[\u1780-\u17FF]/.test(cell) && isNaN(Number(cell))) {
          if (cell !== 'ប្រុស' && cell !== 'ស្រី' && cell !== 'male' && cell !== 'female') {
            if (!nameVal) {
              nameVal = cell;
            }
          }
        }
      }

      // Fallback: If no name found yet, attempt extracting Khmer words from cell string if present
      if (!nameVal && cells.length > 0) {
        for (const cell of cells) {
          if (isHeaderOrFooter(cell)) continue;
          const khmerMatch = cell.match(/[\u1780-\u17FF]{2,}(\s+[\u1780-\u17FF]{2,})*/);
          if (khmerMatch && !isHeaderOrFooter(khmerMatch[0])) {
            nameVal = khmerMatch[0];
            break;
          }
        }
      }

      // Skip row if no valid person name was found or if name is a header/footer label
      if (!nameVal || isHeaderOrFooter(nameVal)) {
        continue;
      }

      const finalTagNum = forceAutoSeq ? seqNumber++ : (tagNumFromRow || seqNumber++);

      if (vehicleTagVal) {
        notesVal = `ស្លាកលេខរថយន្ត ៖ ${vehicleTagVal}`;
      }

      validTags.push({
        id: `imported-${Date.now()}-${validTags.length}-${Math.random().toString(36).substring(2, 6)}`,
        tagNumber: finalTagNum,
        name: nameVal,
        location: locVal || 'ទីតាំងមិនទាន់កំណត់',
        phone: phoneVal,
        notes: notesVal,
        updatedAt: new Date().toISOString()
      });
    }

    return validTags;
  };

  // Extract Khmer text rows from raw binary document streams (DOCX, PDF, RTF, XML, etc.)
  const extractTextFromBinary = (arrayBuffer) => {
    try {
      const textUtf8 = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
      const textUtf16 = new TextDecoder('utf-16le', { fatal: false }).decode(arrayBuffer);
      const combined = textUtf8 + '\n' + textUtf16;

      // Strip XML/HTML tags
      const cleaned = combined.replace(/<[^>]+>/g, '\n');
      const lines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

      const rows = [];
      for (const line of lines) {
        if (/[\u1780-\u17FF]/.test(line)) {
          rows.push([line]);
        }
      }
      return rows;
    } catch {
      return [];
    }
  };

  // 3. Process Uploaded File (Any File Type)
  const processFile = async (file) => {
    if (!file) return;

    setImportStatus(`កំពុងអាន និងស្រង់ទិន្នន័យពីឯកសារ "${file.name}"...`);
    const fileExt = file.name.split('.').pop().toLowerCase();

    try {
      let formattedTags = [];

      // A. JSON File
      if (fileExt === 'json') {
        try {
          const text = await file.text();
          const jsonData = JSON.parse(text);
          if (Array.isArray(jsonData)) {
            const rawRows = jsonData.map((item) => {
              if (typeof item === 'object' && item !== null) {
                return [
                  item.tagNumber || item.number || item.id || '',
                  item.name || item.fullName || item.ឈ្មោះ || '',
                  item.phone || item.tel || item.លេខទូរស័ព្ទ || '',
                  item.location || item.address || item.ទីតាំង || '',
                  item.notes || item.vehicleTag || item.កំណត់សម្គាល់ || ''
                ];
              }
              return [String(item)];
            });
            formattedTags = parseKhmerRowsToTags(rawRows, autoSequence);
          }
        } catch {
          // Fall through
        }
      }

      // B. SheetJS Parsing (Excel: .xlsx, .xls, .ods, .xlsb, .csv, .tsv, .html)
      if (formattedTags.length === 0) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          if (workbook.SheetNames && workbook.SheetNames.length > 0) {
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const raw2DRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
            formattedTags = parseKhmerRowsToTags(raw2DRows, autoSequence);
          }
        } catch {
          // Fall through
        }
      }

      // C. PapaParse CSV/TSV/TXT Parsing
      if (formattedTags.length === 0 && (fileExt === 'csv' || fileExt === 'tsv' || fileExt === 'txt')) {
        await new Promise((resolve) => {
          Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.data && results.data.length > 0) {
                formattedTags = parseKhmerRowsToTags(results.data, autoSequence);
              }
              resolve();
            },
            error: () => resolve()
          });
        });
      }

      // D. Plain Text Parsing (TXT, LOG, MD, XML, RTF)
      if (formattedTags.length === 0) {
        try {
          const text = await file.text();
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          const rows = lines.map((line) => {
            if (line.includes('\t')) return line.split('\t');
            if (line.includes(',')) return line.split(',');
            if (line.includes(';')) return line.split(';');
            if (line.includes('|')) return line.split('|');
            return [line];
          });
          formattedTags = parseKhmerRowsToTags(rows, autoSequence);
        } catch {
          // Fall through
        }
      }

      // E. Binary Document Text Stream Extraction (DOCX, PDF, RTF, DOC, BINARY)
      if (formattedTags.length === 0) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const binaryRows = extractTextFromBinary(arrayBuffer);
          if (binaryRows.length > 0) {
            formattedTags = parseKhmerRowsToTags(binaryRows, autoSequence);
          }
        } catch {
          // Fall through
        }
      }

      if (formattedTags.length === 0) {
        setImportStatus(`មិនអាចស្រង់ទិន្នន័យឈ្មោះពីឯកសារ "${file.name}" នេះបានទេ។ សូមពិនិត្យមើលឯកសាររបស់អ្នក!`);
        return;
      }

      onImportData(formattedTags);
      setImportStatus(`បានលុបទិន្នន័យចាស់ និងនាំចូលទិន្នន័យ ${formattedTags.length} ស្លាកលេខ ពីឯកសារ "${file.name}" ដោយជោគជ័យ!`);
    } catch (err) {
      console.error('File import error:', err);
      setImportStatus(`មានបញ្ហាក្នុងការអានឯកសារ "${file.name}"`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-slate-700/60">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl ring-1 ring-emerald-500/30">
              <FolderArchive className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold font-moul text-emerald-400 flex items-center gap-1.5">
                <span>នាំចូល / នាំចេញ ទិន្នន័យ</span>
                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 font-kantumruy px-2 py-0.5 rounded-full border border-emerald-700/60">
                  គ្រប់ប្រភេទ File
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-kantumruy mt-0.5">
                គាំទ្រគ្រប់ប្រភេទឯកសារ Excel, CSV, Word, PDF, Text, JSON, XML...
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {importStatus && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-kantumruy animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="space-y-4">
          
          {/* Universal Drag & Drop Upload Section */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 relative ${
              isDragging
                ? 'border-emerald-400 bg-emerald-950/40 ring-4 ring-emerald-500/20 scale-[1.01]'
                : 'border-slate-700/80 hover:border-emerald-500/80 bg-slate-950/80'
            }`}
          >
            <Upload className="w-9 h-9 text-emerald-400 mx-auto mb-2.5 animate-bounce" />
            
            <div className="text-sm font-bold text-slate-100 font-kantumruy">
              នាំចូលទិន្នន័យពីគ្រប់ប្រភេទឯកសារ (Bulk Upload)
            </div>
            
            <p className="text-xs text-slate-400 mt-1 mb-3 font-kantumruy leading-relaxed">
              ទម្លាក់ (Drag & Drop) ឬចុចជ្រើសរើសឯកសារគ្រប់ប្រភេទពីកុំព្យូទ័រ/ទូរស័ព្ទ
            </p>

            {/* File type badges */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4 text-[11px] font-medium text-slate-300">
              <span className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-800/60">
                📊 .xlsx, .xls, .ods
              </span>
              <span className="bg-sky-950/80 text-sky-300 px-2 py-0.5 rounded-lg border border-sky-800/60">
                📄 .csv, .tsv, .txt
              </span>
              <span className="bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-800/60">
                📝 .docx, .doc, .pdf
              </span>
              <span className="bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded-lg border border-purple-800/60">
                ⚙️ .json, .xml, .log
              </span>
            </div>

            {/* Auto Sequence Option */}
            <div className="mb-4 text-left bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
              <label className="text-xs text-emerald-300 font-semibold cursor-pointer flex items-center gap-2.5 select-none font-kantumruy">
                <input
                  type="checkbox"
                  checked={autoSequence}
                  onChange={(e) => setAutoSequence(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
                />
                <span>រត់លេខស្លាកស្វ័យប្រវត្តិ (១, ២, ៣...) តាមលំដាប់ឈ្មោះក្នុងឯកសារ</span>
              </label>
            </div>

            <label className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-5 py-3 rounded-xl text-xs shadow-lg shadow-emerald-950/60 cursor-pointer transition-all active:scale-95">
              <FileSpreadsheet className="w-4 h-4" />
              <span>ជ្រើសរើសឯកសារគ្រប់ប្រភេទ (Browse Any File)</span>
              <input
                type="file"
                accept="*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Export Buttons */}
          <div className="pt-1">
            <div className="text-xs font-semibold text-slate-400 mb-2 font-kantumruy">
              ទាញយកទិន្នន័យ (Export Data)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-bold p-3 rounded-xl text-xs transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>ទាញយកជា Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 font-bold p-3 rounded-xl text-xs transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>ទាញយកជា CSV (.csv)</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

