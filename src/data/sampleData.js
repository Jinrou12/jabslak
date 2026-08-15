import { INITIAL_TEMPLE_LOCATIONS } from './templeLocations';

// Generate 1,000 realistic Cambodian Tag records for instant search testing
const firstNames = [
  'សុខ', 'ចាន់', 'សៅ', 'គង់', 'ហ៊ុយ', 'វណ្ណៈ', 'រតនៈ', 'សុភ័ក្ត្រ', 'ពិសិដ្ឋ',
  'មករា', 'តុលា', 'វិសាល', 'ដារ៉ា', 'មុន្នី', 'ប៊ុនថឿន', 'សម័យ', 'ភក្តី', 'សុផល',
  'ម៉ៅ', 'ហេង', 'សេង', 'ជា', 'ងិន', 'លី', 'ថេង', 'អ៊ុក', 'ឃឹម', 'ទៀង'
];

const lastNames = [
  'វណ្ណា', 'សារ៉ាត់', 'ធី', 'សុភា', 'ណារី', 'លីដា', 'បុប្ផា', 'ចន្ថា', 'សុផល',
  'ម៉ាលី', 'ស្រីណុច', 'កន្និដ្ឋា', 'គន្ធា', 'ផល្លា', 'ដានី', 'សុខារី', 'ស្រីម៉ម'
];

const titles = [
  'ឧបាសក', 'ឧបាសិកា', 'ញោម', 'ញោមស្រី', 'លោកតា', 'លោកយាយ', 'លោក', 'អ្នកស្រី'
];

// Use the 21 authentic temple locations as primary location list
export const locationsList = INITIAL_TEMPLE_LOCATIONS.map((loc) => loc.name);

export function generateSampleData(count = 1000) {
  const data = [];
  
  for (let i = 1; i <= count; i++) {
    const title = titles[i % titles.length];
    const fn = firstNames[(i * 7) % firstNames.length];
    const ln = lastNames[(i * 13) % lastNames.length];
    const fullName = `${title} ${fn} ${ln}`;

    const locationName = 'មើលទីកន្លែង';
    const fullLocation = 'មើលទីកន្លែង';

    const phonePrefixes = ['012', '010', '069', '077', '088', '097', '092', '015'];
    const phonePrefix = phonePrefixes[i % phonePrefixes.length];
    const randomDigits = String(100000 + ((i * 3829) % 900000));
    const phone = `${phonePrefix} ${randomDigits.slice(0, 3)} ${randomDigits.slice(3)}`;

    const notesList = [
      'មកដល់ម៉ោង ៨:០០ ព្រឹក',
      'មានកូនចៅជូនមកជាមួយ ២ នាក់',
      'ស្នាក់នៅទីតាំងនេះរហូតដល់បញ្ចប់ពិធី',
      'បានប្រគល់ស្លាកលេខរួចរាល់',
      'ត្រូវការកៅអីរុញ (Wheelchair)',
      'អាហារបួស',
      ''
    ];
    const notes = notesList[i % notesList.length];

    data.push({
      id: `tag-${i}`,
      tagNumber: i,
      name: fullName,
      location: fullLocation,
      baseLocation: '',
      templeLocationId: '',
      phone: phone,
      notes: notes,
      status: i % 15 === 0 ? 'CHECKED_OUT' : 'ACTIVE',
      updatedAt: new Date(Date.now() - (i * 3600000)).toISOString()
    });
  }

  return data;
}

export const INITIAL_TAG_DATA = generateSampleData(1000);
