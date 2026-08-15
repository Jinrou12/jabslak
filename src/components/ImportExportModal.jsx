import React, { useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, File, Sparkles, FolderArchive, PlusCircle, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { khmerToWesternDigits } from '../utils/khmerSearch';

// Convert any Khmer or Western digit string to integer if possible
const parseDigitsToNumber = (str) => {
  if (str === null || str === undefined) return null;
  const western = khmerToWesternDigits(String(str).trim());
  const num = Number(western);
  return !isNaN(num) && western !== '' ? num : null;
};

// Check if a string is purely numeric (in Western or Khmer digits)
const isNumericString = (str) => {
  if (!str) return false;
  const western = khmerToWesternDigits(String(str).trim());
  return !isNaN(Number(western)) && western !== '';
};

export default function ImportExportModal({ onClose, allTags, onImportData }) {
  const [importStatus, setImportStatus] = useState(null);
  const [autoSequence, setAutoSequence] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [importAction, setImportAction] = useState('append'); // 'append' or 'replace'

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

    // Helper: Check if string is a title banner or summary footer
    const isTitleOrSummaryBanner = (str) => {
      if (!str) return true;
      const s = String(str).trim().toLowerCase();
      return (
        s.includes('បញ្ជីឈ្មោះ') ||
        s.includes('បញ្ជីស្លាក') ||
        s.includes('សម្រាប់') ||
        s.includes('សរុប') ||
        s.includes('total') ||
        s.includes('summary') ||
        s === 'ភេទ' ||
        s === 'gender' ||
        s === 'ប្រុស' ||
        s === 'ស្រី'
      );
    };

    // 1. Scan rows to detect Table Header Row and Column Mapping
    let headerRowIdx = -1;
    let nameColIdx = -1;
    let phoneColIdx = -1;
    let locColIdx = -1;
    let notesColIdx = -1;
    let seqColIdx = -1;

    for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      let nIdx = -1, pIdx = -1, lIdx = -1, ntIdx = -1, sIdx = -1;
      let matchesCount = 0;

      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c] || '').trim().toLowerCase();
        if (!cell) continue;

        if (nIdx === -1 && (cell.includes('ឈ្មោះ') || cell.includes('គោត្តនាម') || cell.includes('គោត') || cell.includes('fullname') || cell === 'name')) {
          nIdx = c;
          matchesCount++;
        } else if (pIdx === -1 && (cell.includes('ទូរស័ព្ទ') || cell.includes('phone') || cell.includes('tel') || cell.includes('mobile'))) {
          pIdx = c;
          matchesCount++;
        } else if (sIdx === -1 && (cell === 'ល.រ' || cell === 'លរ' || cell.includes('លេខរៀង') || cell.includes('ស្លាកលេខ') || cell === 'no' || cell === 'id' || cell === '#')) {
          sIdx = c;
          matchesCount++;
        } else if (lIdx === -1 && (cell.includes('ទីតាំង') || cell.includes('កុដិ') || cell.includes('អាគារ') || cell.includes('ព្រះសង្ឃ') || cell.includes('location') || cell.includes('address'))) {
          lIdx = c;
          matchesCount++;
        } else if (ntIdx === -1 && (cell.includes('ផ្សេង') || cell.includes('កំណត់') || cell.includes('កត់') || cell.includes('note') || cell.includes('remark'))) {
          ntIdx = c;
          matchesCount++;
        }
      }

      if (matchesCount >= 2 && nIdx !== -1) {
        headerRowIdx = r;
        nameColIdx = nIdx;
        phoneColIdx = pIdx;
        locColIdx = lIdx;
        notesColIdx = ntIdx;
        seqColIdx = sIdx;
        break;
      }
    }

    const validTags = [];
    let seqNumber = 1;

    // 2A. If Header Row was detected, parse using direct column indices
    if (headerRowIdx !== -1 && nameColIdx !== -1) {
      for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!Array.isArray(row) || row.length === 0) continue;

        const rawName = String(row[nameColIdx] || '').trim();
        if (!rawName || isTitleOrSummaryBanner(rawName) || isNumericString(rawName)) continue;

        // Skip if rawName is header label repeating
        if (rawName.includes('ឈ្មោះ') || rawName.includes('គោត្តនាម')) continue;

        const rawPhone = phoneColIdx !== -1 ? String(row[phoneColIdx] || '').trim() : '';
        const rawLoc = locColIdx !== -1 ? String(row[locColIdx] || '').trim() : '';
        const rawNotes = notesColIdx !== -1 ? String(row[notesColIdx] || '').trim() : '';
        const rawSeq = seqColIdx !== -1 ? String(row[seqColIdx] || '').trim() : '';

        // Extract Tag Number
        let tagNum = seqNumber++;
        if (!forceAutoSeq && rawSeq) {
          const parsedSeq = parseDigitsToNumber(rawSeq);
          if (parsedSeq) tagNum = parsedSeq;
        }

        // Location vs Notes distinction
        let finalLoc = 'មើលទីកន្លែង';
        let finalNotes = rawNotes;

        if (rawLoc) {
          if (rawLoc.includes('កុដិ') || rawLoc.includes('អាគារ') || rawLoc.includes('ធម្មសាលា') || rawLoc.includes('វត្ត') || rawLoc.includes('ក្លោងទ្វារ')) {
            finalLoc = rawLoc;
          } else {
            finalNotes = finalNotes ? `${finalNotes} (${rawLoc})` : rawLoc;
          }
        }

        validTags.push({
          id: `imported-${Date.now()}-${validTags.length}-${Math.random().toString(36).substring(2, 6)}`,
          tagNumber: tagNum,
          name: rawName,
          location: finalLoc,
          phone: rawPhone,
          notes: finalNotes,
          updatedAt: new Date().toISOString()
        });
      }

      if (validTags.length > 0) return validTags;
    }

    // 2B. Positional / Cell Classification Fallback (If no explicit header row)
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!Array.isArray(row) || row.length === 0) continue;

      let cells = row.map((cell) => String(cell || '').trim()).filter(Boolean);
      if (cells.length === 0) continue;

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

      for (const cell of cells) {
        if (isTitleOrSummaryBanner(cell)) continue;

        // Skip index digit strings (e.g. "១", "២", "1", "2")
        if (isNumericString(cell)) {
          const num = parseDigitsToNumber(cell);
          if (num && num > 0 && num < 10000 && !tagNumFromRow) {
            tagNumFromRow = num;
          }
          continue;
        }

        const lower = cell.toLowerCase();

        // Phone number check
        const digitsOnly = cell.replace(/[^0-9]/g, '');
        if (digitsOnly.length >= 8 && digitsOnly.length <= 11 && (cell.startsWith('0') || cell.startsWith('+') || cell.startsWith('855') || cell.includes(' '))) {
          if (!phoneVal) phoneVal = cell;
          continue;
        }

        // Vehicle tag check
        if (/\d[A-Z]{1,2}[-\s]?\d{3,4}/i.test(cell) || lower.includes('ភ្នំពេញ') || lower.includes('កណ្ដាល') || lower.includes('សៀមរាប') || lower.includes('បាត់ដំបង')) {
          if (!vehicleTagVal) vehicleTagVal = cell;
          continue;
        }

        // Location check
        if (lower.includes('កុដិ') || lower.includes('អាគារ') || lower.includes('ធម្មសាលា') || lower.includes('វត្ត') || lower.includes('ក្លោងទ្វារ')) {
          if (!locVal) locVal = cell;
          continue;
        }

        // Person Name check: Contains Khmer characters, not numeric, not header label
        if (/[\u1780-\u17FF]/.test(cell) && !isNumericString(cell)) {
          if (!cell.includes('ឈ្មោះ') && !cell.includes('គោត្តនាម') && !cell.includes('លេខរៀង') && !cell.includes('ស្លាកលេខ')) {
            if (!nameVal) {
              nameVal = cell;
            }
          }
        }
      }

      if (!nameVal || isTitleOrSummaryBanner(nameVal)) continue;

      const finalTagNum = forceAutoSeq ? seqNumber++ : (tagNumFromRow || seqNumber++);
      if (vehicleTagVal) {
        notesVal = notesVal ? `${notesVal} | ស្លាកលេខរថយន្ត ៖ ${vehicleTagVal}` : `ស្លាកលេខរថយន្ត ៖ ${vehicleTagVal}`;
      }

      validTags.push({
        id: `imported-${Date.now()}-${validTags.length}-${Math.random().toString(36).substring(2, 6)}`,
        tagNumber: finalTagNum,
        name: nameVal,
        location: locVal || 'មើលទីកន្លែង',
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
  const processFile = async (file, forceAppendMode = null) => {
    if (!file) return;

    const isAppend = forceAppendMode !== null ? forceAppendMode : (importAction === 'append');

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

      onImportData(formattedTags, isAppend);
      if (isAppend) {
        setImportStatus(`បានបន្ថែមទិន្នន័យ ${formattedTags.length} ស្លាកលេខ ពីឯកសារ "${file.name}" ចូលបញ្ជីដែលមានស្រាប់!`);
      } else {
        setImportStatus(`បានលុបទិន្នន័យចាស់ និងជំនួសដោយទិន្នន័យ ${formattedTags.length} ស្លាកលេខ ពីឯកសារ "${file.name}"!`);
      }
    } catch (err) {
      console.error('File import error:', err);
      setImportStatus(`មានបញ្ហាក្នុងការអានឯកសារ "${file.name}"`);
    }
  };

  const handleFileUpload = (e, isAppendMode = null) => {
    const file = e.target.files?.[0];
    if (file) processFile(file, isAppendMode);
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

          {/* Import Mode Selector Tabs */}
          <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 grid grid-cols-2 gap-1 font-kantumruy">
            <button
              type="button"
              onClick={() => setImportAction('append')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold transition-all ${
                importAction === 'append'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>➕ បន្ថែមលើបញ្ជីដែលមាន</span>
            </button>

            <button
              type="button"
              onClick={() => setImportAction('replace')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold transition-all ${
                importAction === 'replace'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>🔄 ជំនួសបញ្ជីចាស់</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center font-kantumruy px-2">
            {importAction === 'append'
              ? '💡 របៀបបន្ថែម៖ រក្សាទុកស្លាកលេខចាស់ និងបន្ថែមឈ្មោះពី File ថ្មីបន្តរត់លេខបន្ទាប់'
              : '⚠️ របៀបជំនួស៖ លុបទិន្នន័យចាស់ចោលទាំងអស់ ហើយជំនួសដោយ File ថ្មីនេះទាំងស្រុង'}
          </p>
          
          {/* Universal Drag & Drop Upload Section */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 relative ${
              isDragging
                ? 'border-emerald-400 bg-emerald-950/40 ring-4 ring-emerald-500/20 scale-[1.01]'
                : 'border-slate-700/80 hover:border-emerald-500/80 bg-slate-950/80'
            }`}
          >
            <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-bounce" />
            
            <div className="text-sm font-bold text-slate-100 font-kantumruy">
              {importAction === 'append' ? 'បន្ថែមទិន្នន័យពី File ថ្មី (Add File Data)' : 'ជំនួសទិន្នន័យចាស់ដោយ File ថ្មី'}
            </div>
            
            <p className="text-xs text-slate-400 mt-1 mb-3 font-kantumruy leading-relaxed">
              ទម្លាក់ (Drag & Drop) ឬចុចជ្រើសរើសឯកសារពីកុំព្យូទ័រ/ទូរស័ព្ទ
            </p>

            {/* File type badges */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3 text-[11px] font-medium text-slate-300">
              <span className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-800/60">
                📊 .xlsx, .xls, .ods
              </span>
              <span className="bg-sky-950/80 text-sky-300 px-2 py-0.5 rounded-lg border border-sky-800/60">
                📄 .csv, .tsv, .txt
              </span>
              <span className="bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-800/60">
                📝 .docx, .doc, .pdf
              </span>
            </div>

            {/* Auto Sequence Option */}
            <div className="mb-4 text-left bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
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

            {/* Action Buttons: Explicit Add vs Replace Buttons */}
            <div className="grid grid-cols-1 gap-2">
              <label className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-4 py-3 rounded-xl text-xs shadow-lg shadow-emerald-950/60 cursor-pointer transition-all active:scale-95">
                <PlusCircle className="w-4 h-4" />
                <span>➕ បន្ថែមទិន្នន័យពី File ថ្មី (Add File Data)</span>
                <input
                  type="file"
                  accept="*"
                  onChange={(e) => handleFileUpload(e, true)}
                  className="hidden"
                />
              </label>

              <label className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 hover:border-amber-500/50 font-bold px-4 py-2.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer">
                <RefreshCw className="w-4 h-4" />
                <span>🔄 ជំនួសទិន្នន័យចាស់ទាំងស្រុង (Replace All)</span>
                <input
                  type="file"
                  accept="*"
                  onChange={(e) => handleFileUpload(e, false)}
                  className="hidden"
                />
              </label>
            </div>

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

