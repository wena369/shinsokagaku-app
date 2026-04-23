import { BASIC_TRAITS, LUCKY_COLORS } from '../data/shinsodata';
import { SHINSO_81_DESCRIPTIONS } from '../data/shinso81';

/**
 * Recursive Digit Sum (単数変換)
 * Sum digits of n until it becomes a single digit (1-9).
 * 0 becomes 9 in many spiritual systems, but here we strictly follow the user rules.
 */
export function recursiveDigitSum(n: number): number {
  if (n <= 0) return 0;
  let res = n;
  while (res > 9) {
    let sum = 0;
    const str = res.toString();
    for (let i = 0; i < str.length; i++) {
      sum += parseInt(str[i], 10);
    }
    res = sum;
  }
  return res === 0 ? 9 : res;
}

/**
 * Internal logic for "Divide by 2" (二分の一)
 * If odd (e.g. 5), 5/2 = 2.5 -> ignore '.' and add digits (2+5=7).
 * If even (e.g. 2), 2/2 = 1.
 */
export function divideByTwoShinso(digit: number): number {
  if (digit % 2 === 0) {
    return digit / 2;
  } else {
    // 5 -> 2.5 -> 2+5=7
    // 3 -> 1.5 -> 1+5=6
    // 1 -> 0.5 -> 0+5=5
    // 7 -> 3.5 -> 3+5=8
    // 9 -> 4.5 -> 4+5=9
    const half = digit / 2;
    const s = half.toString();
    const parts = s.split('.');
    const integerPart = parseInt(parts[0], 10) || 0;
    const fractionalPart = 5; // always .5 for odd digits
    return recursiveDigitSum(integerPart + fractionalPart);
  }
}

/**
 * Combined Shinso Logic (各桁ごとに足し合わせ、10以上は単数変換)
 */
export function combineShinso(s1: string, s2: string): string {
  if (!s1 || !s2 || s1.length !== 3 || s2.length !== 3) return "999";
  const x = recursiveDigitSum(parseInt(s1[0]) + parseInt(s2[0]));
  const y = recursiveDigitSum(parseInt(s1[1]) + parseInt(s2[1]));
  const z = recursiveDigitSum(parseInt(s1[2]) + parseInt(s2[2]));
  return `${x}${y}${z}`;
}

export interface DetailedShinso {
  shinso: string;         // X Y Z
  x: number;              // Group
  y: number;              // Sub-influence
  z: number;              // Circulation (3rd digit)
  basicNumber: string;    // 3-digit basic number from table
  luckRhythmNumber: number; // (X + Z) sum
  conceptionSelf: string; // Shinso - 178 (borrow rule)
  conceptionOther: string;// Shinso + 178 (add rule)
  binarySequence: string[]; // Inheritance list
  luckColorX: string;
  luckColorNameX?: string;
  luckColorY: string;
  luckColorNameY?: string;
  luckColorZ: string;
  luckColorNameZ?: string;
  positionGroup: number;  // 1st, 2nd, 3rd (square)
  hakkendenMatrix: string[][];
  transformationAges: number[];
  transformationYears: number[];
  trait: string;
  description: string;
}

export function getDetailedShinso(year: number, month: number, day: number, manualShinso?: string): DetailedShinso {
  let x: number, y: number, z: number;

  if (manualShinso && manualShinso.length === 3) {
    x = parseInt(manualShinso[0], 10);
    y = parseInt(manualShinso[1], 10);
    z = parseInt(manualShinso[2], 10);
  } else {
    // X: Year recursive digit sum
    x = recursiveDigitSum(year);
    // Y: Month + Day recursive digit sum
    // Sum digits of month and digits of day
    const monthStr = month.toString();
    const dayStr = day.toString();
    let monthDaySum = 0;
    for (let i = 0; i < monthStr.length; i++) monthDaySum += parseInt(monthStr[i], 10);
    for (let i = 0; i < dayStr.length; i++) monthDaySum += parseInt(dayStr[i], 10);
    y = recursiveDigitSum(monthDaySum);
    // Z: Sum of X and Y recursive digit sum
    z = recursiveDigitSum(x + y);
  }
  const shinso = `${x}${y}${z}`;
  
  // 1. Circulation (循環数) = Z
  // Already z.

  // 2. Luck Rhythm (運気数) = X + Z recursive sum
  const luckRhythmNumber = recursiveDigitSum(x + z);

  // 3. Conception (受胎数)
  // Self: Shinso - 178 (Special borrow rule)
  // Rule: if d_i < sub_i, r_i = d_i + (9 - sub_i). Else d_i - sub_i.
  const sub = [1, 7, 8];
  const selfDigits = [x, y, z].map((d, i) => {
    if (d < sub[i]) {
      return d + (9 - sub[i]);
    } else {
      let r = d - sub[i];
      return r === 0 ? 9 : r; // In this system, 0 usually becomes 9
    }
  });
  const conceptionSelf = selfDigits.join('');

  // Other: Shinso + 178 (Special add rule)
  // Rule: r_i = recursiveDigitSum(d_i + add_i)
  const add = [1, 7, 8];
  const otherDigits = [x, y, z].map((d, i) => {
    return recursiveDigitSum(d + add[i]);
  });
  const conceptionOther = otherDigits.join('');

  // 4. Binary/Inheritance sequence (二分の一)
  const sequence: string[] = [];
  let current = shinso;
  const seen = new Set<string>();
  
  // Limit to 20 to prevent infinite loops, though theory says it loops.
  for(let i=0; i<20; i++) {
    if (seen.has(current)) break;
    seen.add(current);
    sequence.push(current);
    const nx = divideByTwoShinso(parseInt(current[0]));
    const ny = divideByTwoShinso(parseInt(current[1]));
    const nz = divideByTwoShinso(parseInt(current[2]));
    current = `${nx}${ny}${nz}`;
  }

  // Basic Number Mapping based on official 81 table
  const BASIC_NUMBER_MAPPING: Record<string, string> = {
    // Group 1
    "112": "663", "123": "639", "134": "696",
    "145": "663", "156": "639", "167": "696",
    "178": "663", "189": "639", "191": "696",
    // Group 2
    "213": "369", "224": "336", "235": "393",
    "246": "369", "257": "336", "268": "393",
    "279": "369", "281": "336", "292": "393",
    // Group 3
    "314": "966", "325": "933", "336": "336",
    "347": "966", "358": "933", "369": "369",
    "371": "966", "382": "933", "393": "393",
    // Group 4
    "415": "663", "426": "639", "437": "696",
    "448": "663", "459": "639", "461": "696",
    "472": "663", "483": "639", "494": "696",
    // Group 5
    "516": "369", "527": "336", "538": "393",
    "549": "369", "551": "336", "562": "393",
    "573": "369", "584": "336", "595": "393",
    // Group 6
    "617": "966", "628": "933", "639": "639",
    "641": "966", "652": "933", "663": "663",
    "674": "966", "685": "933", "696": "696",
    // Group 7
    "718": "663", "729": "639", "731": "696",
    "742": "663", "753": "639", "764": "696",
    "775": "663", "786": "639", "797": "696",
    // Group 8
    "819": "369", "821": "336", "832": "393",
    "843": "369", "854": "336", "865": "393",
    "876": "369", "887": "336", "898": "393",
    // Group 9
    "911": "966", "922": "933", "933": "933",
    "944": "966", "955": "933", "966": "966",
    "977": "966", "988": "933", "999": "999",
  };

  // Basic Number (Lookup from exact mapping, or fallback to simple sum if not found)
  const basicNumber = BASIC_NUMBER_MAPPING[shinso] || recursiveDigitSum(x + y + z).toString();

  // Position Group (Based on "Parent-Child Relationship Chart" table provided by user)
  const SHINSO_GROUPS: Record<number, { g1: number[], g2: number[], g3: number[] }> = {
    1: { g1: [2, 6], g2: [3, 5], g3: [1, 4, 7, 8, 9] },
    2: { g1: [2, 5, 7, 8, 9], g2: [3, 4], g3: [1, 6] },
    3: { g1: [1, 5, 6], g2: [7, 8, 9], g3: [2, 3, 4] },
    4: { g1: [2, 3], g2: [1, 4, 5, 7, 9], g3: [6, 8] },
    5: { g1: [6, 7], g2: [2, 4, 5, 8, 9], g3: [1, 3] },
    6: { g1: [3, 4, 8], g2: [1, 2, 9], g3: [5, 6, 7] },
    7: { g1: [1, 2, 4, 7, 9], g2: [5, 6], g3: [3, 8] },
    8: { g1: [3, 7], g2: [4, 6], g3: [1, 2, 5, 8, 9] },
    9: { g1: [2, 3, 6, 7], g2: [4, 5], g3: [1, 8, 9] }
  };

  let positionGroup = 3;
  const groups = SHINSO_GROUPS[x];
  if (groups.g1.includes(y)) positionGroup = 1;
  else if (groups.g2.includes(y)) positionGroup = 2;
  else positionGroup = 3;

  const groupTrait = BASIC_TRAITS[x];

  // 5. Hakkenden (Dynamic 9x9 Matrix based on traversal rules)
  const sortedShinsoList: string[] = [];
  for (let sx = 1; sx <= 9; sx++) {
    for (let sy = 1; sy <= 9; sy++) {
      sortedShinsoList.push(`${sx}${sy}${recursiveDigitSum(sx + sy)}`);
    }
  }

  // Define traversal order starting from center (4,4)
  const traversal: [number, number][] = [];
  // Row 4 to 8 in Column 4
  for (let r = 4; r <= 8; r++) traversal.push([r, 4]);
  // Columns 5, 6, 7, 8, 0, 1, 2, 3
  const nextCols = [5, 6, 7, 8, 0, 1, 2, 3];
  for (const c of nextCols) {
    for (let r = 0; r <= 8; r++) traversal.push([r, c]);
  }
  // Row 0 to 3 in Column 4
  for (let r = 0; r <= 3; r++) traversal.push([r, 4]);

  // Create empty 9x9 matrix
  const hakkendenMatrix: string[][] = Array(9).fill(null).map(() => Array(9).fill(""));

  // Find index of selfShinso in sorted list
  const selfIdx = sortedShinsoList.indexOf(shinso);
  if (selfIdx !== -1) {
    for (let j = 0; j < 81; j++) {
      const [tr, tc] = traversal[j];
      hakkendenMatrix[tr][tc] = sortedShinsoList[(selfIdx + j) % 81];
    }
  }

  // Transformation Ages: Z + 9n
  const transformationAges = [z, z + 9, z + 18, z + 27, z + 36, z + 45, z + 54, z + 63, z + 72, z + 81, z + 90];

  // Transformation Years: BirthYear + transformation age
  const transformationYears = transformationAges.map(age => year + age);

  // --- Description Logic ---
  let description = SHINSO_81_DESCRIPTIONS[shinso];
  if (!description) {
    description = "詳細な特徴データが見つかりませんでした。";
  }

  return {
    shinso,
    x, y, z,
    basicNumber,
    luckRhythmNumber,
    conceptionSelf,
    conceptionOther,
    binarySequence: sequence,
    luckColorX: LUCKY_COLORS[x].hex,
    luckColorNameX: LUCKY_COLORS[x].name,
    luckColorY: LUCKY_COLORS[y].hex,
    luckColorNameY: LUCKY_COLORS[y].name,
    luckColorZ: LUCKY_COLORS[z].hex,
    luckColorNameZ: LUCKY_COLORS[z].name,
    positionGroup,
    hakkendenMatrix,
    transformationAges,
    transformationYears,
    trait: groupTrait?.trait || "未知",
    description
  };
}

export function getLuckPositionIndex(targetYear: number, luckNumber: number): number {
  const yearSum = recursiveDigitSum(targetYear);
  // Rule: Double White Circle (G, index 6) corresponds to yearSum.
  // Number at index G (6): N(6) = yearSum.
  // Numbers go 1, 2, 3... or 9, 8, 7? 
  // User said: "右側に向かうほど9,8,7..." and "右側には2,3,4..."
  // Probably: G(yearSum) -> H(yearSum-1) -> I(yearSum-2) or G(yearSum) -> H(yearSum+1)?
  // Based on "2026 is 1, so Double circle is 1", and common bionum cycles go 1, 9, 8, 7...
  // idx = (6 + yearSum - luckNumber) % 9
  // Example: yearSum=1 (2026), luckNumber=1 -> idx=6 (G)
  // Example: yearSum=1 (2026), luckNumber=9 -> idx=7 (H)
  let idx = (6 + yearSum - luckNumber) % 9;
  if (idx < 0) idx += 9;
  return idx;
}

export const LUCK_ZONE_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

export function parseDate(dateStr: string) {
  if (!dateStr) return { year: 0, month: 0, day: 0 };
  const parts = dateStr.split('-');
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    day: parseInt(parts[2], 10)
  };
}

export interface FamilyMember {
  name: string;
  birthDate: string; // ISO format YYYY-MM-DD
  gender: 'male' | 'female';
  manualShinso?: string; // 3 digits like "123"
}

export interface FamilyData {
  paternalGrandfather: FamilyMember;
  paternalGrandmother: FamilyMember;
  maternalGrandfather: FamilyMember;
  maternalGrandmother: FamilyMember;
  spousePaternalGrandfather: FamilyMember;
  spousePaternalGrandmother: FamilyMember;
  spouseMaternalGrandfather: FamilyMember;
  spouseMaternalGrandmother: FamilyMember;
  father: FamilyMember;
  mother: FamilyMember;
  self: FamilyMember;
  spouse: FamilyMember;
  spouseFather: FamilyMember;
  spouseMother: FamilyMember;
  siblings: FamilyMember[]; // Max 4
  children: FamilyMember[]; // Max 6
  grandchildren: FamilyMember[]; // Max 6
  interestedPeople: FamilyMember[]; // Max 4
}

export const INITIAL_MEMBER: FamilyMember = { name: '', birthDate: '', gender: 'male' };

export const INITIAL_FAMILY_DATA: FamilyData = {
  paternalGrandfather: { ...INITIAL_MEMBER },
  paternalGrandmother: { ...INITIAL_MEMBER },
  maternalGrandfather: { ...INITIAL_MEMBER },
  maternalGrandmother: { ...INITIAL_MEMBER },
  spousePaternalGrandfather: { ...INITIAL_MEMBER },
  spousePaternalGrandmother: { ...INITIAL_MEMBER },
  spouseMaternalGrandfather: { ...INITIAL_MEMBER },
  spouseMaternalGrandmother: { ...INITIAL_MEMBER },
  father: { ...INITIAL_MEMBER },
  mother: { ...INITIAL_MEMBER },
  self: { ...INITIAL_MEMBER },
  spouse: { ...INITIAL_MEMBER },
  spouseFather: { ...INITIAL_MEMBER },
  spouseMother: { ...INITIAL_MEMBER },
  siblings: Array(4).fill(null).map(() => ({ ...INITIAL_MEMBER })),
  children: Array(6).fill(null).map(() => ({ ...INITIAL_MEMBER })),
  grandchildren: Array(6).fill(null).map(() => ({ ...INITIAL_MEMBER })),
  interestedPeople: Array(4).fill(null).map(() => ({ ...INITIAL_MEMBER })),
};
