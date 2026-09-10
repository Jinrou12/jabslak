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
    color: 'lime',
    min: 1,
    max: 46,
    generateCoords: (count) => {
      const coords = [];
      const cols = 7;
      const spacingX = 1.0;
      const spacingY = 1.22;
      const cx = 30.7;
      const cy = 44.3;
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
      const spacingX = 1.05;
      const spacingY = 1.25;
      const cx = 36.5;
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
      const cols = 2;
      const spacingX = 1.15;
      const spacingY = 1.28;
      const cx = 47.7;
      const cy = 33.8;
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
    color: 'orange',
    min: 93,
    max: 111,
    generateCoords: (count) => {
      const coords = [];
      const cols = 5;
      const spacingX = 1.2;
      const spacingY = 1.28;
      const cx = 53.5;
      const cy = 50.6;
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
      const spacingX = 1.15;
      const spacingY = 1.25;
      const cx = 53.0;
      const cy = 43.8;
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
      { x: 55.8, y: 38.8 }, { x: 56.7, y: 39.8 }, { x: 57.7, y: 40.8 }, { x: 58.7, y: 41.8 }, { x: 59.7, y: 42.8 },
      { x: 56.5, y: 38.0 }, { x: 57.4, y: 39.0 }, { x: 58.4, y: 40.0 }, { x: 59.4, y: 41.0 }, { x: 60.4, y: 42.0 }
    ]
  },
  {
    name: 'ផែន៧ ៖ តាមកុដិ',
    color: 'rose',
    min: 134,
    max: 150,
    generateCoords: () => [
      // 4 pins in vertical trail through bottom trees:
      { x: 34.0, y: 58.0 }, { x: 34.2, y: 59.8 }, { x: 34.4, y: 61.6 }, { x: 34.6, y: 63.4 },
      // 3 pins in front of golden pagoda:
      { x: 38.2, y: 55.0 }, { x: 39.4, y: 55.0 }, { x: 40.6, y: 55.0 },
      // 2 pins above Zone 2 blue cluster:
      { x: 36.0, y: 32.2 }, { x: 37.2, y: 32.2 },
      // 4 pins on roof above Zone 1:
      { x: 32.8, y: 36.6 }, { x: 34.0, y: 36.6 }, { x: 33.3, y: 37.8 }, { x: 34.5, y: 37.8 },
      // 3 pins near kutis:
      { x: 24.5, y: 38.2 }, { x: 28.8, y: 32.8 }, { x: 33.6, y: 32.4 }
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
