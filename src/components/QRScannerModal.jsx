import React, { useEffect, useRef, useState } from 'react';
import { X, QrCode, Camera, AlertCircle, Search } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { westernToKhmerDigits } from '../utils/khmerSearch';

export default function QRScannerModal({ onClose, onScanSuccess, allTags }) {
  const scannerRef = useRef(null);
  const [manualInput, setManualInput] = useState('');
  const [scanError, setScanError] = useState(null);

  useEffect(() => {
    let scanner = null;

    try {
      scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          try {
            // Check if decodedText is JSON
            let parsed = null;
            if (decodedText.startsWith('{')) {
              parsed = JSON.parse(decodedText);
            }

            const targetTagNum = parsed ? parsed.tagNumber : decodedText;

            // Search tag in list
            const matchedTag = allTags.find(
              (t) => String(t.tagNumber) === String(targetTagNum) || t.id === decodedText
            );

            if (matchedTag) {
              if (scanner) scanner.clear();
              onScanSuccess(matchedTag);
            } else {
              setScanError(`រកមិនឃើញស្លាកលេខ: ${targetTagNum}`);
            }
          } catch (e) {
            setScanError('QR Code មិនត្រឹមត្រូវ');
          }
        },
        (error) => {
          // Ignore frequent scan frame warnings
        }
      );
    } catch (err) {
      console.error('QR Scanner Init Error:', err);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((e) => console.error(e));
      }
    };
  }, [allTags, onScanSuccess]);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    const matchedTag = allTags.find(
      (t) => String(t.tagNumber) === manualInput.trim()
    );

    if (matchedTag) {
      onScanSuccess(matchedTag);
    } else {
      setScanError(`រកមិនឃើញស្លាកលេខ: #${manualInput}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-700/60">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-moul text-emerald-400">
                ស្កែន QR Code ស្លាកលេខ
              </h2>
              <p className="text-xs text-slate-400 font-kantumruy">
                ដាក់កាមេរ៉ាទូរស័ព្ទតម្រង់ QR code លើកាតស្លាកលេខ
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

        {/* Scanner Viewport Box */}
        <div className="bg-slate-950 rounded-2xl overflow-hidden border-2 border-emerald-500/30 p-2 shadow-inner relative min-h-[260px] flex flex-col justify-center">
          <div id="qr-reader-container" className="w-full"></div>
        </div>

        {scanError && (
          <div className="mt-3 bg-rose-950/40 border border-rose-800/40 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2 font-kantumruy">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Fallback Manual Number Input */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <input
              type="number"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="ឬ វាយលេខស្លាកផ្ទាល់ (ឧ. 15)..."
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>ស្វែងរក</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
