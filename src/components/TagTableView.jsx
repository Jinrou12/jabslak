import React from 'react';
import { MapPin, Phone, Eye, User, Hash, Map as MapIcon } from 'lucide-react';
import { westernToKhmerDigits } from '../utils/khmerSearch';

export default function TagTableView({ tags, onSelectTag, onViewOnMap }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-200">
          {/* Table Header */}
          <thead className="bg-slate-950/90 text-slate-400 text-xs font-bold uppercase border-b border-slate-800 font-kantumruy">
            <tr>
              <th scope="col" className="px-4 py-3.5 text-center w-24">លេខស្លាក</th>
              <th scope="col" className="px-4 py-3.5">ឈ្មោះម្ចាស់ស្លាក</th>
              <th scope="col" className="px-4 py-3.5">ទីតាំងស្លាកលេខ (Location)</th>
              <th scope="col" className="px-4 py-3.5">លេខទូរស័ព្ទ</th>
              <th scope="col" className="px-4 py-3.5 text-center">មើលលម្អិត</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/80 font-kantumruy">
            {tags.map((tag) => {
              const khmerTagNo = westernToKhmerDigits(tag.tagNumber);
              return (
                <tr
                  key={tag.id}
                  onClick={() => onSelectTag(tag)}
                  className="hover:bg-slate-800/60 cursor-pointer transition-colors group"
                >
                  {/* Tag Number */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-xl text-xs shadow-md shadow-amber-500/20 font-sans-en">
                      {khmerTagNo}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3 font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                    {tag.name}
                  </td>

                  {/* Location - High visibility */}
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        if (onViewOnMap) {
                          e.stopPropagation();
                          onViewOnMap(tag.baseLocation || tag.location);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-xl text-xs font-extrabold transition-all"
                      title="ចុចដើម្បីមើលទីតាំងលើផែនទីវត្ត"
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{tag.location}</span>
                      <MapIcon className="w-3 h-3 opacity-60 ml-1" />
                    </button>
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3 text-xs text-slate-300 font-sans-en">
                    {tag.phone ? (
                      <span className="flex items-center gap-1 text-sky-400 font-medium">
                        <Phone className="w-3 h-3" />
                        {tag.phone}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">-</span>
                    )}
                  </td>

                  {/* Action Button */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTag(tag);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-xl transition-all inline-flex items-center justify-center"
                      title="មើលព័ត៌មានលម្អិត"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
