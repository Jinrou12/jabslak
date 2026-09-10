// Generator script to produce initialTab3Locations.js
import fs from 'fs';

const khmerDigits = ['០','១','២','៣','៤','៥','៦','៧','៨','៩'];
function westernToKhmerDigits(num) {
  if (num == null) return '';
  return String(num).replace(/\d/g, d => khmerDigits[parseInt(d, 10)]);
}

const tagsObj = JSON.parse(fs.readFileSync('tags_firebase.json', 'utf8').replace(/^\uFEFF/, ''));
const allTags = Object.values(tagsObj).sort((a,b) => Number(a.tagNumber) - Number(b.tagNumber));

const tab3Base = JSON.parse(fs.readFileSync('tab3_firebase.json', 'utf8').replace(/^\uFEFF/, '')).value;

function groupTagsByName(tags) {
  const map = new Map();
  tags.forEach(tag => {
    const rawName = tag.name || '';
    const cleanName = rawName.replace(/^ស្លាកលេខ\s*\S+\s*៖\s*/, '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().normalize('NFC');
    const key = cleanName ? cleanName.toLowerCase() : ('tag_' + (tag.tagNumber || tag.id));
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(tag);
  });
  return Array.from(map.values()).map(list => {
    const primary = list[0];
    return {
      name: primary.name,
      tagNumbers: list.map(t => t.tagNumber).filter(Boolean),
      count: list.length,
      primary
    };
  });
}

const zones = [
  { name: 'ផែន១ ៖ ធម្មសភា', color: 'emerald', min: 1, max: 46, cx: 29.5, cy: 52.0 },
  { name: 'ផែន២ ៖ សាលាឆាន់ចាស់', color: 'sky', min: 47, max: 58, cx: 39.5, cy: 44.5 },
  { name: 'ផែន៣ ៖ មុខសាលាឆាន់ចាស់', color: 'pink', min: 59, max: 92, cx: 36.5, cy: 48.5 },
  { name: 'ផែន៤ ៖ ព្រះបរិនិព្វាន', color: 'amber', min: 93, max: 111, cx: 51.0, cy: 58.0 },
  { name: 'ផែន៥ ៖ បណ្ណាល័យ', color: 'lime', min: 112, max: 123, cx: 53.0, cy: 51.5 },
  { name: 'ផែន៦ ៖ ព្រះផ្ទម', color: 'purple', min: 124, max: 133, cx: 56.5, cy: 40.0 },
  { name: 'ផែន៧ ៖ តាមកុដិ', color: 'rose', min: 134, max: 150, cx: 43.0, cy: 32.0 },
];

const tagPins = [];
zones.forEach(z => {
  const zTags = allTags.filter(t => Number(t.tagNumber) >= z.min && Number(t.tagNumber) <= z.max);
  const grouped = groupTagsByName(zTags);
  const count = grouped.length;
  const cols = Math.ceil(Math.sqrt(count));
  const spacing = 1.8;
  grouped.forEach((g, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const offsetX = (col - (cols - 1) / 2) * spacing;
    const offsetY = (row - (Math.ceil(count / cols) - 1) / 2) * spacing;
    
    const tagDisp = g.tagNumbers.map(n => westernToKhmerDigits(n)).join(', ');
    const tagNum = g.primary.tagNumber;
    tagPins.push({
      id: 'tag-' + tagNum,
      name: 'ស្លាកលេខ ' + tagDisp + ' ៖ ' + (g.name || ''),
      x: parseFloat((z.cx + offsetX).toFixed(2)),
      y: parseFloat((z.cy + offsetY).toFixed(2)),
      type: 'building',
      pos: 'R',
      badgeColor: z.color,
      category: z.name,
      tagNumber: tagNum,
      tagNumberDisplay: tagDisp,
      tagOwnerName: g.name || '',
      isTagPin: true,
      isUnpinned: false,
      tagNumbers: g.tagNumbers
    });
  });
});

const cleanedBase = tab3Base.map(loc => {
  let cat = loc.category;
  if (loc.type === 'gate' || loc.name.includes('ខ្លោងទ្វារ') || ['A','B','C','D','E'].includes(loc.id)) {
    cat = '⛩️ ក្រុមខ្លោងទ្វារវត្ត';
  } else {
    cat = '🏢 ក្រុមអគារ និង កុដិ';
  }
  return {
    ...loc,
    category: cat
  };
});

const full169 = [...tagPins, ...cleanedBase];

const fileContent = `// 169 Authentic Wat Khemavan Tab 3 Pin Locations (124 Tag Pins + 45 Base Landmarks)
export const INITIAL_TAB3_LOCATIONS = ${JSON.stringify(full169, null, 2)};
`;

fs.writeFileSync('src/data/initialTab3Locations.js', fileContent, 'utf8');
console.log('Successfully generated src/data/initialTab3Locations.js with ' + full169.length + ' locations!');
