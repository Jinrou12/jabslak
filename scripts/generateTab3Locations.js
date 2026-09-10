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

// 7 Zones with pixel-perfect coordinates matching Image 2 reference exactly
const zones = [
  {
    name: 'ផែន១ ៖ ធម្មសភា',
    color: 'emerald',
    min: 1,
    max: 46,
    generateCoords: (count) => {
      const coords = [];
      const cols = 7;
      const spacingX = 1.15;
      const spacingY = 1.35;
      const cx = 31.0;
      const cy = 44.8;
      for (let idx = 0; idx < count; idx++) {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const ox = (col - (cols - 1) / 2) * spacingX;
        const oy = (row - (Math.ceil(count / cols) - 1) / 2) * spacingY;
        coords.push({
          x: parseFloat((cx + ox).toFixed(2)),
          y: parseFloat((cy + oy).toFixed(2))
        });
      }
      return coords;
    }
  },
  {
    name: 'ផែន២ ៖ សាលាឆាន់ចាស់',
    color: 'sky',
    min: 47,
    max: 58,
    generateCoords: (count) => {
      const coords = [];
      const cols = 3;
      const spacingX = 1.1;
      const spacingY = 1.3;
      const cx = 36.3;
      const cy = 38.0;
      for (let idx = 0; idx < count; idx++) {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const ox = (col - (cols - 1) / 2) * spacingX;
        const oy = (row - (Math.ceil(count / cols) - 1) / 2) * spacingY;
        coords.push({
          x: parseFloat((cx + ox).toFixed(2)),
          y: parseFloat((cy + oy).toFixed(2))
        });
      }
      return coords;
    }
  },
  {
    name: 'ផែន៣ ៖ មុខសាលាឆាន់ចាស់',
    color: 'pink',
    min: 59,
    max: 92,
    generateCoords: (count) => {
      const coords = [];
      const cols = 4;
      const spacingX = 1.1;
      const spacingY = 1.25;
      const cx = 33.2;
      const cy = 40.5;
      for (let idx = 0; idx < count; idx++) {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const ox = (col - (cols - 1) / 2) * spacingX;
        const oy = (row - (Math.ceil(count / cols) - 1) / 2) * spacingY;
        coords.push({
          x: parseFloat((cx + ox).toFixed(2)),
          y: parseFloat((cy + oy).toFixed(2))
        });
      }
      return coords;
    }
  },
  {
    name: 'ផែន៤ ៖ ព្រះបរិនិព្វាន',
    color: 'amber',
    min: 93,
    max: 111,
    generateCoords: (count) => {
      const coords = [];
      const cols = 5;
      const spacingX = 1.3;
      const spacingY = 1.4;
      const cx = 53.6;
      const cy = 50.8;
      for (let idx = 0; idx < count; idx++) {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const ox = (col - (cols - 1) / 2) * spacingX;
        const oy = (row - (Math.ceil(count / cols) - 1) / 2) * spacingY;
        coords.push({
          x: parseFloat((cx + ox).toFixed(2)),
          y: parseFloat((cy + oy).toFixed(2))
        });
      }
      return coords;
    }
  },
  {
    name: 'ផែន៥ ៖ បណ្ណាល័យ',
    color: 'lime',
    min: 112,
    max: 123,
    generateCoords: (count) => {
      const coords = [];
      const cols = 4;
      const spacingX = 1.25;
      const spacingY = 1.4;
      const cx = 52.8;
      const cy = 43.5;
      for (let idx = 0; idx < count; idx++) {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const ox = (col - (cols - 1) / 2) * spacingX;
        const oy = (row - (Math.ceil(count / cols) - 1) / 2) * spacingY;
        coords.push({
          x: parseFloat((cx + ox).toFixed(2)),
          y: parseFloat((cy + oy).toFixed(2))
        });
      }
      return coords;
    }
  },
  {
    name: 'ផែន៦ ៖ ព្រះផ្ទម',
    color: 'purple',
    min: 124,
    max: 133,
    generateCoords: () => [
      { x: 54.5, y: 37.8 }, { x: 55.4, y: 38.8 }, { x: 56.4, y: 39.8 }, { x: 57.4, y: 40.8 }, { x: 58.4, y: 41.8 },
      { x: 55.2, y: 37.0 }, { x: 56.1, y: 38.0 }, { x: 57.1, y: 39.0 }, { x: 58.1, y: 40.0 }, { x: 59.1, y: 41.0 }
    ]
  },
  {
    name: 'ផែន៧ ៖ តាមកុដិ',
    color: 'rose',
    min: 134,
    max: 150,
    generateCoords: () => [
      { x: 35.5, y: 34.5 }, { x: 36.8, y: 35.5 }, // 2 pins near Gate D
      // 8 pins at Kuti Yeay Ta (2 cols x 4 rows)
      { x: 46.9, y: 31.8 }, { x: 48.1, y: 31.8 },
      { x: 46.9, y: 33.1 }, { x: 48.1, y: 33.1 },
      { x: 46.9, y: 34.4 }, { x: 48.1, y: 34.4 },
      { x: 46.9, y: 35.7 }, { x: 48.1, y: 35.7 },
      // 2 pins above library building
      { x: 50.8, y: 34.8 }, { x: 52.2, y: 34.8 },
      // 1 pin at top of golden pagoda
      { x: 39.5, y: 42.5 },
      // 3 pins in front of golden pagoda
      { x: 37.5, y: 54.8 }, { x: 38.8, y: 54.8 }, { x: 40.0, y: 54.8 }
    ]
  },
];

const tagPins = [];
zones.forEach(z => {
  const zTags = allTags.filter(t => Number(t.tagNumber) >= z.min && Number(t.tagNumber) <= z.max);
  const grouped = groupTagsByName(zTags);
  const coordsList = z.generateCoords(grouped.length);
  
  grouped.forEach((g, idx) => {
    const pt = coordsList[idx] || coordsList[coordsList.length - 1];
    const tagDisp = g.tagNumbers.map(n => westernToKhmerDigits(n)).join(', ');
    const tagNum = g.primary.tagNumber;
    tagPins.push({
      id: 'tag-' + tagNum,
      name: 'ស្លាកលេខ ' + tagDisp + ' ៖ ' + (g.name || ''),
      x: pt.x,
      y: pt.y,
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
