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

  // Helper parser function to map Excel/CSV row data to tag object
  const parseRowToTag = (row, idx) => {
    // 1. Tag Number Parsing
    let tagNum = null;
    if (!autoSequence) {
      const tagKeys = [
        'លេខស្លាក (Tag Number)', 'លេខស្លាក', 'ស្លាកលេខ', 'Tag Number', 
        'tagNumber', 'Tag', 'tag', 'No', 'no', 'លេខរៀង', 'ID', 'id'
      ];
      for (const k of tagKeys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          const parsed = parseInt(String(row[k]).replace(/[^0-9]/g, ''), 10);
          if (!isNaN(parsed) && parsed > 0) {
            tagNum = parsed;
            break;
          }
        }
      }
    }
    // If autoSequence is true or no valid tag number in row, sequence 1, 2, 3... based on file row order
    if (!tagNum) {
      tagNum = idx + 1;
    }

    // 2. Name Parsing
    const nameKeys = [
      'ឈ្មោះ (Name)', 'ឈ្មោះ', 'ឈ្មោះមនុស្ស', 'ឈ្មោះម្ចាស់', 'ឈ្មោះអ្នកស្នាក់នៅ', 
      'Name', 'name', 'Full Name', 'fullname'
    ];
    let nameVal = '';
    for (const k of nameKeys) {
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
        nameVal = String(row[k]).trim();
        break;
      }
    }
    // Fallback name search if headers differ
    if (!nameVal) {
      for (const key of Object.keys(row)) {
        const val = String(row[key] || '').trim();
        if (val && !key.includes('ស្លាក') && !key.includes('tag') && !key.includes('phone') && !key.includes('ទូរស័ព្ទ')) {
          nameVal = val;
          break;
        }
      }
    }

    // 3. Location Parsing
    const locKeys = [
      'ទីតាំង (Location)', 'ទីតាំង', 'កុដិ', 'អាគារ', 'Location', 'location', 'Address', 'address'
    ];
    let locVal = '';
    for (const k of locKeys) {
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
        locVal = String(row[k]).trim();
        break;
      }
    }

    // 4. Phone Parsing
    const phoneKeys = [
      'លេខទូរស័ព្ទ (Phone)', 'លេខទូរស័ព្ទ', 'ទូរស័ព្ទ', 'Phone', 'phone', 'Tel', 'tel', 'Mobile', 'mobile'
    ];
    let phoneVal = '';
    for (const k of phoneKeys) {
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
        phoneVal = String(row[k]).trim();
        break;
      }
    }

    // 5. Notes Parsing
    const notesKeys = [
      'កំណត់សម្គាល់ (Notes)', 'កំណត់សម្គាល់', 'សម្គាល់', 'Notes', 'notes', 'Remark', 'remark'
    ];
    let notesVal = '';
    for (const k of notesKeys) {
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
        notesVal = String(row[k]).trim();
        break;
      }
    }

    return {
      id: `imported-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      tagNumber: tagNum,
      name: nameVal || `ឈ្មោះ #${idx + 1}`,
      location: locVal || 'ទីតាំងមិនទាន់កំណត់',
      phone: phoneVal,
      notes: notesVal,
      updatedAt: new Date().toISOString()
    };
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
          const jsonData = XLSX.utils.sheet_to_json(ws);

          const formattedTags = jsonData.map((row, idx) => parseRowToTag(row, idx));

          onImportData(formattedTags);
          setImportStatus(`បានលុបទិន្នន័យចាស់ និងនាំចូលទិន្នន័យ ${formattedTags.length} ស្លាកលេខថ្មី ដោយជោគជ័យ!`);
        } catch (err) {
          setImportStatus('មានបញ្ហាក្នុងការអានឯកសារ Excel');
        }
      };
      reader.readAsBinaryString(file);
    } else if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const formattedTags = results.data.map((row, idx) => parseRowToTag(row, idx));

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
