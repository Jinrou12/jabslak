import React, { useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function ImportExportModal({ onClose, allTags, onImportData }) {
  const [importStatus, setImportStatus] = useState(null);

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

  const [autoSequence, setAutoSequence] = useState(true);

  // Smart Khmer Excel & CSV parser: Accurately extracts Person Name, Phone Number, Vehicle Tag & Tag Numbers
  const parseKhmerRowsToTags = (rawRows) => {
    if (!Array.isArray(rawRows) || rawRows.length === 0) return [];

    const isHeaderOrFooter = (str) => {
      if (!str) return true;
      const s = String(str).trim().toLowerCase();
      return (
        s.includes('គោតមនាម') ||
        s.includes('បញ្ជីឈ្មោះ') ||
        s.includes('សម្រាប់ប្រើប្រាស់') ||
        s.includes('សរុប') ||
        s.includes('total') ||
        s.includes('summary') ||
        s.includes('លេខរៀង') ||
        s.includes('ស្លាកលេខយានយន្ត') ||
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
      const cells = row.map((cell) => String(cell || '').trim()).filter(Boolean);
      if (cells.length === 0) continue;

      let nameVal = '';
      let phoneVal = '';
      let vehicleTagVal = '';
      let locVal = '';
      let notesVal = '';

      // Scan all cells in the current row
      for (const cell of cells) {
        // Skip exact header/footer matches or title banners
        if (isHeaderOrFooter(cell)) {
          continue;
        }

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

        // Check if person name: Contains Khmer characters, not purely numbers, not gender (ប្រុស/ស្រី)
        if (/[\u1780-\u17FF]/.test(cell) && isNaN(Number(cell))) {
          if (cell !== 'ប្រុស' && cell !== 'ស្រី' && cell !== 'male' && cell !== 'female') {
            if (!nameVal) {
              nameVal = cell;
            }
          }
        }
      }

      // Skip row if no valid person name was found or if name is a header/footer label
      if (!nameVal || isHeaderOrFooter(nameVal)) {
        continue;
      }

      const tagNum = seqNumber++;

      if (vehicleTagVal) {
        notesVal = `ស្លាកលេខរថយន្ត ៖ ${vehicleTagVal}`;
      }

      validTags.push({
        id: `imported-${Date.now()}-${validTags.length}-${Math.random().toString(36).substring(2, 6)}`,
        tagNumber: tagNum,
        name: nameVal,
        location: locVal || 'ទីតាំងមិនទាន់កំណត់',
        phone: phoneVal,
        notes: notesVal,
        updatedAt: new Date().toISOString()
      });
    }

    return validTags;
  };

  // 3. Import File Handler (Excel or CSV)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();

    if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const raw2DRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

          const formattedTags = parseKhmerRowsToTags(raw2DRows);

          if (formattedTags.length === 0) {
            setImportStatus('មិនអាចរកឃើញទិន្នន័យឈ្មោះក្នុងឯកសារនេះទេ');
            return;
          }

          onImportData(formattedTags);
          setImportStatus(`បានលុបទិន្នន័យចាស់ និងនាំចូលទិន្នន័យ ${formattedTags.length} ស្លាកលេខថ្មី ដោយជោគជ័យ!`);
        } catch (err) {
          setImportStatus('មានបញ្ហាក្នុងការអានឯកសារ Excel');
        }
      };
      reader.readAsBinaryString(file);
    } else if (fileExt === 'csv') {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const formattedTags = parseKhmerRowsToTags(results.data);

          if (formattedTags.length === 0) {
            setImportStatus('មិនអាចរកឃើញទិន្នន័យឈ្មោះក្នុងឯកសារ CSV នេះទេ');
            return;
          }

          onImportData(formattedTags);
          setImportStatus(`បានលុបទិន្នន័យចាស់ និងនាំចូលទិន្នន័យ CSV ចំនួន ${formattedTags.length} ថ្មី ដោយជោគជ័យ!`);
        }
      });
    } else {
      setImportStatus('សូមជ្រើសរើសឯកសារ .xlsx, .xls ឬ .csv');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-700/60">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-moul text-emerald-400">
                នាំចូល / នាំចេញ ទិន្នន័យ (Excel & CSV)
              </h2>
              <p className="text-xs text-slate-400 font-kantumruy">
                គ្រប់គ្រងឯកសារបញ្ជីឈ្មោះ និងស្លាកលេខ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {importStatus && (
          <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-700/50 text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-kantumruy">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="space-y-4">
          
          {/* Upload Section */}
          <div className="bg-slate-950/80 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-5 text-center transition-all">
            <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-pulse" />
            <div className="text-sm font-bold text-slate-200 font-kantumruy">
              នាំចូលទិន្នន័យពី Excel ឬ CSV (Bulk Import)
            </div>
            <p className="text-xs text-slate-400 mt-1 mb-3 font-kantumruy">
              ជ្រើសរើសឯកសារ .xlsx ឬ .csv ដើម្បីបញ្ចូលបញ្ជីស្លាកលេខរាប់ពាន់
            </p>

            {/* Auto Sequence Option */}
            <div className="my-3 text-left bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
              <label className="text-[11px] text-emerald-300 font-semibold cursor-pointer flex items-center gap-2 select-none font-kantumruy">
                <input
                  type="checkbox"
                  checked={autoSequence}
                  onChange={(e) => setAutoSequence(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <span>រត់លេខស្លាកស្វ័យប្រវត្តិ (១, ២, ៣...) តាមលំដាប់ឈ្មោះក្នុងឯកសារ</span>
              </label>
            </div>

            <label className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-900/30 cursor-pointer transition-all active:scale-95">
              <FileSpreadsheet className="w-4 h-4" />
              <span>ជ្រើសរើសឯកសារ (Browse File)</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Export Buttons */}
          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-400 mb-2 font-kantumruy">
              ទាញយកទិន្នន័យ (Export Data)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-bold p-3 rounded-xl text-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>ទាញយកជា Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 font-bold p-3 rounded-xl text-xs transition-all"
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
