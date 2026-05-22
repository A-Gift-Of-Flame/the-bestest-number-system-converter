import type { Base, ConvertError } from './converter';

export type Lang = 'en' | 'nl';
export const SUPPORTED_LANGS = ['en', 'nl'] as const satisfies readonly Lang[];

let currentLang: Lang = 'en';
export function setLang(l: Lang) { currentLang = l; }
export function getLang(): Lang   { return currentLang; }
export function t(): Translation  { return LANGS[currentLang]; }

/* ── Types ──────────────────────────────────────────────────── */
export interface TrickRule {
  title: string;
  body?: string;
  example?: string;
  table?: { headers: string[]; rows: string[][] };
}
export interface TrickCard  { title: string; rules: TrickRule[]; }
export interface TrickSection { title: string; cards: TrickCard[]; }

export interface BaseLabels {
  label: string;
  description: string;
}

export interface Translation {
  themeLight: string;
  themeDark: string;
  tabConverter: string;
  tabTricks: string;
  labelValue: string;
  labelInputBase: string;
  placeholder: string;
  bits: string;
  bytes: string;
  copy: string;
  copied: string;
  source: string;
  tricksIntro: string;
  bases: Record<Base, BaseLabels>;
  formatError: (e: ConvertError) => string;
  tricks: TrickSection[];
}

/* ══════════════════════════════════════════════════════════════
   ENGLISH
══════════════════════════════════════════════════════════════ */
const EN: Translation = {
  themeLight: '☀ Light',
  themeDark:  '☽ Dark',
  tabConverter: 'Converter',
  tabTricks:    'Mental Tricks',
  labelValue:     'Value',
  labelInputBase: 'Input base',
  placeholder: 'Enter a value…',
  bits:   'Bits',
  bytes:  'Bytes',
  copy:   'Copy',
  copied: 'Copied!',
  source: 'source',
  tricksIntro: 'Mental shortcuts for converting between number systems by hand. Each section covers one conversion pair with step-by-step rules and worked examples.',
  bases: {
    text:      { label: 'Text (UTF-8)',    description: 'Plain text string' },
    binary:    { label: 'Binary',          description: 'Base-2' },
    octal:     { label: 'Octal',           description: 'Base-8' },
    decimal:   { label: 'Decimal',         description: 'Base-10' },
    hex:       { label: 'Hexadecimal',     description: 'Base-16' },
    base32:    { label: 'Base32',          description: 'RFC 4648' },
    base64:    { label: 'Base64',          description: 'Standard (RFC 4648)' },
    base64url: { label: 'Base64url',       description: 'URL-safe (RFC 4648)' },
  },
  formatError(e) {
    switch (e.code) {
      case 'EMPTY_INPUT':          return 'Empty input';
      case 'INVALID_BINARY':       return 'Invalid binary — only 0 and 1 allowed';
      case 'INVALID_OCTAL':        return 'Invalid octal — only digits 0–7 allowed';
      case 'INVALID_DECIMAL':      return 'Invalid decimal — only digits 0–9 allowed';
      case 'INVALID_HEX':          return 'Invalid hex — only 0–9 and A–F allowed';
      case 'INVALID_BASE32_CHAR':  return `Invalid Base32 character: '${e.char}'`;
      case 'INVALID_BASE64_POS':   return `Invalid Base64 character at position ${e.pos}`;
    }
  },
  tricks: [
    {
      title: 'Binary ↔ Decimal',
      cards: [
        {
          title: 'Binary → Decimal: positional weights',
          rules: [
            {
              title: 'The method',
              body: 'Each bit position has a weight that is a power of 2. Write the weights above each bit (right to left: 1, 2, 4, 8, 16, 32, 64, 128…). Multiply each bit by its weight and sum.',
              example:
`  Bit positions (right to left):
  128  64  32  16   8   4   2   1
    1   0   1   1   0   1   0   1

  = 128 + 32 + 16 + 4 + 1
  = 181`,
            },
            {
              title: 'Quick powers of 2 to memorize',
              body: 'Memorize up to 2¹⁰ = 1024 and you can handle most real-world values.',
              table: {
                headers: ['2ⁿ', 'Value'],
                rows: [
                  ['2⁰','1'],['2¹','2'],['2²','4'],['2³','8'],['2⁴','16'],
                  ['2⁵','32'],['2⁶','64'],['2⁷','128'],['2⁸','256'],
                  ['2⁹','512'],['2¹⁰','1024'],
                ],
              },
            },
          ],
        },
        {
          title: 'Decimal → Binary: repeated halving',
          rules: [
            {
              title: 'The method',
              body: 'Repeatedly divide by 2. Write the <strong>remainders bottom-up</strong> — that is the binary number.',
              example:
`  181 ÷ 2 = 90  remainder 1   ← LSB
   90 ÷ 2 = 45  remainder 0
   45 ÷ 2 = 22  remainder 1
   22 ÷ 2 = 11  remainder 0
   11 ÷ 2 =  5  remainder 1
    5 ÷ 2 =  2  remainder 1
    2 ÷ 2 =  1  remainder 0
    1 ÷ 2 =  0  remainder 1   ← MSB

  Read remainders upward: 10110101`,
            },
            {
              title: 'Even/odd shortcut',
              body: 'The last (rightmost) bit tells you even or odd instantly: <strong>0 = even, 1 = odd</strong>. No division needed.',
            },
          ],
        },
      ],
    },
    {
      title: 'Binary ↔ Hexadecimal',
      cards: [
        {
          title: 'Binary → Hex: group into nibbles (4 bits)',
          rules: [
            {
              title: 'The method',
              body: 'Split binary into groups of 4 bits from the right. Pad left with zeros if needed. Convert each group directly to one hex digit.',
              example:
`  1011 0101

  1011 → B
  0101 → 5

  Result: 0xB5`,
            },
            {
              title: 'Nibble lookup table',
              body: 'These 16 mappings are the only thing you need to memorize.',
              table: {
                headers: ['Bits', 'Hex', '', 'Bits', 'Hex'],
                rows: [
                  ['0000','0','','1000','8'],['0001','1','','1001','9'],
                  ['0010','2','','1010','A'],['0011','3','','1011','B'],
                  ['0100','4','','1100','C'],['0101','5','','1101','D'],
                  ['0110','6','','1110','E'],['0111','7','','1111','F'],
                ],
              },
            },
          ],
        },
        {
          title: 'Hex → Binary: expand each digit to 4 bits',
          rules: [
            {
              title: 'The method',
              body: 'Replace each hex digit with its 4-bit binary equivalent. Concatenate. Strip leading zeros for the final value.',
              example:
`  0x3F

  3 → 0011
  F → 1111

  Result: 0011 1111 = 111111 (= 63)`,
            },
            {
              title: 'Why it works',
              body: '16 = 2⁴, so one hex digit maps exactly to 4 binary digits. This is a <strong>lossless, mechanical substitution</strong> — no arithmetic required.',
            },
          ],
        },
      ],
    },
    {
      title: 'Binary ↔ Octal',
      cards: [
        {
          title: 'Binary → Octal: group into triads (3 bits)',
          rules: [
            {
              title: 'The method',
              body: 'Split binary into groups of 3 bits from the right. Pad left with zeros if needed. Convert each group directly to one octal digit (0–7).',
              example:
`  10 110 101

  010 → 2
  110 → 6
  101 → 5

  Result: 0o265`,
            },
            {
              title: 'Triad lookup',
              body: 'Only 8 patterns to know — binary 000–111 map to octal 0–7.',
              table: {
                headers: ['Bits', 'Octal'],
                rows: [
                  ['000','0'],['001','1'],['010','2'],['011','3'],
                  ['100','4'],['101','5'],['110','6'],['111','7'],
                ],
              },
            },
          ],
        },
        {
          title: 'Octal → Binary: expand each digit to 3 bits',
          rules: [
            {
              title: 'The method',
              body: 'Replace each octal digit with its 3-bit binary equivalent. Concatenate. Strip leading zeros.',
              example:
`  0o265

  2 → 010
  6 → 110
  5 → 101

  Result: 010110101 = 10110101`,
            },
          ],
        },
      ],
    },
    {
      title: 'Hexadecimal ↔ Decimal',
      cards: [
        {
          title: 'Hex → Decimal: positional weights (powers of 16)',
          rules: [
            {
              title: 'The method',
              body: 'Each hex digit position has weight 16ⁿ (right to left: 1, 16, 256, 4096…). Multiply each digit value (A=10…F=15) by its weight and sum.',
              example:
`  0x2AF3

  Position weights (right to left):
  16³=4096  16²=256  16¹=16  16⁰=1

    2×4096 + A(10)×256 + F(15)×16 + 3×1
  = 8192 + 2560 + 240 + 3
  = 10995`,
            },
            {
              title: 'Powers of 16 to memorize',
              table: {
                headers: ['16ⁿ', 'Value'],
                rows: [
                  ['16⁰','1'],['16¹','16'],['16²','256'],['16³','4,096'],['16⁴','65,536'],
                ],
              },
            },
          ],
        },
        {
          title: 'Decimal → Hex: repeated division by 16',
          rules: [
            {
              title: 'The method',
              body: 'Repeatedly divide by 16. Write remainders (converting 10–15 to A–F) bottom-up.',
              example:
`  10995 ÷ 16 = 687  remainder  3  → '3'
    687 ÷ 16 =  42  remainder 15  → 'F'
     42 ÷ 16 =   2  remainder 10  → 'A'
      2 ÷ 16 =   0  remainder  2  → '2'

  Read upward: 0x2AF3`,
            },
            {
              title: 'Shortcut via binary',
              body: 'Convert decimal → binary (repeated halving), then group bits into nibbles → hex. Often faster for numbers you can halve quickly in your head.',
            },
          ],
        },
      ],
    },
    {
      title: 'Base64',
      cards: [
        {
          title: 'How Base64 encoding works',
          rules: [
            {
              title: 'The algorithm',
              body: 'Take 3 bytes (24 bits). Split into four 6-bit groups. Map each group to a character using the Base64 alphabet (A–Z = 0–25, a–z = 26–51, 0–9 = 52–61, + = 62, / = 63). Pad with <strong>=</strong> if input is not a multiple of 3 bytes.',
              example:
`  "Man" → bytes: 0x4D 0x61 0x6E

  Binary: 01001101 01100001 01101110
  Groups: 010011 010110 000101 101110
  Values:     19     22      5     46
  Chars:       T      W      F      u

  Result: "TWFu"`,
            },
            {
              title: 'Recognizing Base64',
              body: 'Base64 strings use only <strong>A–Z, a–z, 0–9, +, /</strong> and end with 0–2 <strong>=</strong> padding characters. Length is always a multiple of 4. URL-safe Base64 replaces <strong>+ → -</strong> and <strong>/ → _</strong> (no padding).',
            },
            {
              title: 'Size ratio',
              body: 'Base64 output is always <strong>⌈n/3⌉ × 4</strong> characters — roughly 33% larger than the input bytes.',
              example:
`   3 bytes →  4 chars   (ratio 4/3)
   6 bytes →  8 chars
   9 bytes → 12 chars
  10 bytes → 16 chars   (padded)`,
            },
          ],
        },
        {
          title: 'Base64 alphabet reference',
          rules: [
            {
              title: 'Key anchor values to memorize',
              body: 'You don\'t need the full table — anchor on these ranges:',
              table: {
                headers: ['Value range', 'Characters', 'Notes'],
                rows: [
                  ['0–25',  'A–Z', 'Uppercase letters'],
                  ['26–51', 'a–z', 'Lowercase letters'],
                  ['52–61', '0–9', 'Digits'],
                  ['62', '+ (or - in URL-safe)', ''],
                  ['63', '/ (or _ in URL-safe)', ''],
                ],
              },
            },
          ],
        },
      ],
    },
    {
      title: 'Base32',
      cards: [
        {
          title: 'How Base32 encoding works (RFC 4648)',
          rules: [
            {
              title: 'The algorithm',
              body: 'Take 5 bytes (40 bits). Split into eight 5-bit groups. Map each group to the Base32 alphabet (A–Z = 0–25, 2–7 = 26–31). Pad output to a multiple of 8 characters with <strong>=</strong>.',
              example:
`  "Hello" → bytes: 0x48 0x65 0x6C 0x6C 0x6F

  Binary: 01001000 01100101 01101100 01101100 01101111
  5-bit:  01001 00001 10010 10110 11000 11011 00011 01111
  Values:     9      1     18     22     24     27      3     15
  Chars:      J      B      S      W      Y      3      D      P

  Result: "JBSWY3DP"`,
            },
            {
              title: 'Base32 alphabet',
              body: 'Uses only <strong>A–Z</strong> and <strong>2–7</strong>. Digits 0 and 1 are excluded to avoid confusion with O and I. Always uppercase.',
              table: { headers: ['Values', 'Chars'], rows: [['0–25','A–Z'],['26–31','2–7']] },
            },
            {
              title: 'Size ratio',
              body: 'Base32 output is <strong>⌈n/5⌉ × 8</strong> characters — roughly 60% larger than the input.',
              example:
`   5 bytes →  8 chars
  10 bytes → 16 chars
   3 bytes →  8 chars  (with 6 × '=' padding)`,
            },
          ],
        },
      ],
    },
    {
      title: 'Practical shortcuts',
      cards: [
        {
          title: 'Fast checks you can do mentally',
          rules: [
            {
              title: 'Even or odd',
              body: 'Last binary bit: <strong>0 = even, 1 = odd</strong>. Last hex digit even (0,2,4,6,8,A,C,E) = even number.',
            },
            {
              title: 'Divisible by powers of 2',
              body: 'A number is divisible by 2ⁿ if its last <strong>n binary bits</strong> are all zero.',
              example:
`  0b10110100 — last 2 bits are 00 → divisible by 4
  0xAF80     — last hex digit 0  → divisible by 16`,
            },
            {
              title: 'Hex ↔ Decimal for single digits',
              body: 'A=10, B=11, C=12, D=13, E=14, F=15. For two-digit hex: <strong>first digit × 16 + second digit</strong>. E.g. 0xFF = 15×16+15 = 255.',
            },
            {
              title: 'Common values to recognize on sight',
              table: {
                headers: ['Decimal', 'Hex', 'Binary', 'Notes'],
                rows: [
                  ['255',   '0xFF',   '11111111',         '8-bit max, full byte'],
                  ['256',   '0x100',  '100000000',        '2⁸, one byte overflow'],
                  ['127',   '0x7F',   '01111111',         'INT8_MAX'],
                  ['128',   '0x80',   '10000000',         'INT8 sign bit'],
                  ['1024',  '0x400',  '10000000000',      '2¹⁰, "one K"'],
                  ['65535', '0xFFFF', '1111111111111111', '16-bit max'],
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};

/* ══════════════════════════════════════════════════════════════
   DUTCH
══════════════════════════════════════════════════════════════ */
const NL: Translation = {
  themeLight: '☀ Licht',
  themeDark:  '☽ Donker',
  tabConverter: 'Converter',
  tabTricks:    'Mentale Trucs',
  labelValue:     'Waarde',
  labelInputBase: 'Invoerbasis',
  placeholder: 'Voer een waarde in…',
  bits:   'Bits',
  bytes:  'Bytes',
  copy:   'Kopieer',
  copied: 'Gekopieerd!',
  source: 'bron',
  tricksIntro: 'Mentale ezelsbruggetjes voor het met de hand omrekenen tussen talstelsels. Elk onderdeel behandelt één conversiepaar met stapsgewijze regels en uitgewerkte voorbeelden.',
  bases: {
    text:      { label: 'Tekst (UTF-8)',   description: 'Gewone tekstreeks' },
    binary:    { label: 'Binair',          description: 'Grondtal 2' },
    octal:     { label: 'Octaal',          description: 'Grondtal 8' },
    decimal:   { label: 'Decimaal',        description: 'Grondtal 10' },
    hex:       { label: 'Hexadecimaal',    description: 'Grondtal 16' },
    base32:    { label: 'Base32',          description: 'RFC 4648' },
    base64:    { label: 'Base64',          description: 'Standaard (RFC 4648)' },
    base64url: { label: 'Base64url',       description: 'URL-veilige variant (RFC 4648)' },
  },
  formatError(e) {
    switch (e.code) {
      case 'EMPTY_INPUT':          return 'Lege invoer';
      case 'INVALID_BINARY':       return 'Ongeldig binair getal — alleen 0 en 1 toegestaan';
      case 'INVALID_OCTAL':        return 'Ongeldig octaal getal — alleen cijfers 0–7 toegestaan';
      case 'INVALID_DECIMAL':      return 'Ongeldig decimaal getal — alleen cijfers 0–9 toegestaan';
      case 'INVALID_HEX':          return 'Ongeldig hexadecimaal — alleen 0–9 en A–F toegestaan';
      case 'INVALID_BASE32_CHAR':  return `Ongeldig Base32-teken: '${e.char}'`;
      case 'INVALID_BASE64_POS':   return `Ongeldig Base64-teken op positie ${e.pos}`;
    }
  },
  tricks: [
    {
      title: 'Binair ↔ Decimaal',
      cards: [
        {
          title: 'Binair → Decimaal: positionele gewichten',
          rules: [
            {
              title: 'De methode',
              body: 'Elke bitpositie heeft een gewicht dat een macht van 2 is. Schrijf de gewichten boven elke bit (rechts naar links: 1, 2, 4, 8, 16, 32, 64, 128…). Vermenigvuldig elke bit met zijn gewicht en tel op.',
              example:
`  Bitposities (rechts naar links):
  128  64  32  16   8   4   2   1
    1   0   1   1   0   1   0   1

  = 128 + 32 + 16 + 4 + 1
  = 181`,
            },
            {
              title: 'Machten van 2 om te onthouden',
              body: 'Onthoud tot 2¹⁰ = 1024 en je kunt de meeste praktische waarden aan.',
              table: {
                headers: ['2ⁿ', 'Waarde'],
                rows: [
                  ['2⁰','1'],['2¹','2'],['2²','4'],['2³','8'],['2⁴','16'],
                  ['2⁵','32'],['2⁶','64'],['2⁷','128'],['2⁸','256'],
                  ['2⁹','512'],['2¹⁰','1024'],
                ],
              },
            },
          ],
        },
        {
          title: 'Decimaal → Binair: herhaald halveren',
          rules: [
            {
              title: 'De methode',
              body: 'Deel herhaaldelijk door 2. Schrijf de <strong>resten van onder naar boven</strong> — dat is het binaire getal.',
              example:
`  181 ÷ 2 = 90  rest 1   ← LSB
   90 ÷ 2 = 45  rest 0
   45 ÷ 2 = 22  rest 1
   22 ÷ 2 = 11  rest 0
   11 ÷ 2 =  5  rest 1
    5 ÷ 2 =  2  rest 1
    2 ÷ 2 =  1  rest 0
    1 ÷ 2 =  0  rest 1   ← MSB

  Lees resten van onder naar boven: 10110101`,
            },
            {
              title: 'Even/oneven snelkoppeling',
              body: 'Het laatste (meest rechtse) bit vertelt je meteen even of oneven: <strong>0 = even, 1 = oneven</strong>. Geen deling nodig.',
            },
          ],
        },
      ],
    },
    {
      title: 'Binair ↔ Hexadecimaal',
      cards: [
        {
          title: 'Binair → Hex: groepeer in nibbles (4 bits)',
          rules: [
            {
              title: 'De methode',
              body: 'Splits binair in groepen van 4 bits van rechts af. Vul links aan met nullen indien nodig. Converteer elke groep direct naar één hexadecimaal cijfer.',
              example:
`  1011 0101

  1011 → B
  0101 → 5

  Resultaat: 0xB5`,
            },
            {
              title: 'Nibble opzoektabel',
              body: 'Deze 16 koppelingen zijn het enige dat je hoeft te onthouden.',
              table: {
                headers: ['Bits', 'Hex', '', 'Bits', 'Hex'],
                rows: [
                  ['0000','0','','1000','8'],['0001','1','','1001','9'],
                  ['0010','2','','1010','A'],['0011','3','','1011','B'],
                  ['0100','4','','1100','C'],['0101','5','','1101','D'],
                  ['0110','6','','1110','E'],['0111','7','','1111','F'],
                ],
              },
            },
          ],
        },
        {
          title: 'Hex → Binair: breid elk cijfer uit naar 4 bits',
          rules: [
            {
              title: 'De methode',
              body: 'Vervang elk hexadecimaal cijfer door zijn 4-bits binaire equivalent. Plak samen. Verwijder voorloopnullen voor de eindwaarde.',
              example:
`  0x3F

  3 → 0011
  F → 1111

  Resultaat: 0011 1111 = 111111 (= 63)`,
            },
            {
              title: 'Waarom het werkt',
              body: '16 = 2⁴, dus één hexadecimaal cijfer komt exact overeen met 4 binaire cijfers. Dit is een <strong>verliesloze, mechanische substitutie</strong> — geen rekenen nodig.',
            },
          ],
        },
      ],
    },
    {
      title: 'Binair ↔ Octaal',
      cards: [
        {
          title: 'Binair → Octaal: groepeer in triades (3 bits)',
          rules: [
            {
              title: 'De methode',
              body: 'Splits binair in groepen van 3 bits van rechts af. Vul links aan met nullen indien nodig. Converteer elke groep direct naar één octaal cijfer (0–7).',
              example:
`  10 110 101

  010 → 2
  110 → 6
  101 → 5

  Resultaat: 0o265`,
            },
            {
              title: 'Triade opzoektabel',
              body: 'Slechts 8 patronen om te kennen — binair 000–111 correspondeert met octaal 0–7.',
              table: {
                headers: ['Bits', 'Octaal'],
                rows: [
                  ['000','0'],['001','1'],['010','2'],['011','3'],
                  ['100','4'],['101','5'],['110','6'],['111','7'],
                ],
              },
            },
          ],
        },
        {
          title: 'Octaal → Binair: breid elk cijfer uit naar 3 bits',
          rules: [
            {
              title: 'De methode',
              body: 'Vervang elk octaal cijfer door zijn 3-bits binaire equivalent. Plak samen. Verwijder voorloopnullen.',
              example:
`  0o265

  2 → 010
  6 → 110
  5 → 101

  Resultaat: 010110101 = 10110101`,
            },
          ],
        },
      ],
    },
    {
      title: 'Hexadecimaal ↔ Decimaal',
      cards: [
        {
          title: 'Hex → Decimaal: positionele gewichten (machten van 16)',
          rules: [
            {
              title: 'De methode',
              body: 'Elke hexadecimale cijferpositie heeft gewicht 16ⁿ (rechts naar links: 1, 16, 256, 4096…). Vermenigvuldig elke cijferwaarde (A=10…F=15) met zijn gewicht en tel op.',
              example:
`  0x2AF3

  Positionele gewichten (rechts naar links):
  16³=4096  16²=256  16¹=16  16⁰=1

    2×4096 + A(10)×256 + F(15)×16 + 3×1
  = 8192 + 2560 + 240 + 3
  = 10995`,
            },
            {
              title: 'Machten van 16 om te onthouden',
              table: {
                headers: ['16ⁿ', 'Waarde'],
                rows: [
                  ['16⁰','1'],['16¹','16'],['16²','256'],['16³','4.096'],['16⁴','65.536'],
                ],
              },
            },
          ],
        },
        {
          title: 'Decimaal → Hex: herhaald delen door 16',
          rules: [
            {
              title: 'De methode',
              body: 'Deel herhaaldelijk door 16. Schrijf resten (10–15 omzetten naar A–F) van onder naar boven.',
              example:
`  10995 ÷ 16 = 687  rest  3  → '3'
    687 ÷ 16 =  42  rest 15  → 'F'
     42 ÷ 16 =   2  rest 10  → 'A'
      2 ÷ 16 =   0  rest  2  → '2'

  Lees van onder naar boven: 0x2AF3`,
            },
            {
              title: 'Snelkoppeling via binair',
              body: 'Converteer decimaal → binair (herhaald halveren), groepeer dan bits in nibbles → hex. Vaak sneller voor getallen die je makkelijk kunt halveren.',
            },
          ],
        },
      ],
    },
    {
      title: 'Base64',
      cards: [
        {
          title: 'Hoe Base64-codering werkt',
          rules: [
            {
              title: 'Het algoritme',
              body: 'Neem 3 bytes (24 bits). Splits in vier 6-bits groepen. Koppel elke groep aan een teken via het Base64-alfabet (A–Z = 0–25, a–z = 26–51, 0–9 = 52–61, + = 62, / = 63). Vul aan met <strong>=</strong> als invoer geen veelvoud van 3 bytes is.',
              example:
`  "Man" → bytes: 0x4D 0x61 0x6E

  Binair: 01001101 01100001 01101110
  Groepen: 010011 010110 000101 101110
  Waarden:     19     22      5     46
  Tekens:       T      W      F      u

  Resultaat: "TWFu"`,
            },
            {
              title: 'Base64 herkennen',
              body: 'Base64-reeksen gebruiken alleen <strong>A–Z, a–z, 0–9, +, /</strong> en eindigen met 0–2 <strong>=</strong> opvultekens. Lengte is altijd een veelvoud van 4. URL-veilige Base64 vervangt <strong>+ → -</strong> en <strong>/ → _</strong> (zonder opvulling).',
            },
            {
              title: 'Grootteratio',
              body: 'Base64-uitvoer is altijd <strong>⌈n/3⌉ × 4</strong> tekens — ongeveer 33% groter dan de invoerbytes.',
              example:
`   3 bytes →  4 tekens   (ratio 4/3)
   6 bytes →  8 tekens
   9 bytes → 12 tekens
  10 bytes → 16 tekens   (met opvulling)`,
            },
          ],
        },
        {
          title: 'Base64-alfabetreferentie',
          rules: [
            {
              title: 'Belangrijkste ankerpunten om te onthouden',
              body: 'Je hoeft niet de hele tabel te kennen — onthoud deze bereiken:',
              table: {
                headers: ['Waardebereik', 'Tekens', 'Noten'],
                rows: [
                  ['0–25',  'A–Z', 'Hoofdletters'],
                  ['26–51', 'a–z', 'Kleine letters'],
                  ['52–61', '0–9', 'Cijfers'],
                  ['62', '+ (of - URL-veilig)', ''],
                  ['63', '/ (of _ URL-veilig)', ''],
                ],
              },
            },
          ],
        },
      ],
    },
    {
      title: 'Base32',
      cards: [
        {
          title: 'Hoe Base32-codering werkt (RFC 4648)',
          rules: [
            {
              title: 'Het algoritme',
              body: 'Neem 5 bytes (40 bits). Splits in acht 5-bits groepen. Koppel elke groep aan het Base32-alfabet (A–Z = 0–25, 2–7 = 26–31). Vul uitvoer aan tot een veelvoud van 8 tekens met <strong>=</strong>.',
              example:
`  "Hello" → bytes: 0x48 0x65 0x6C 0x6C 0x6F

  Binair: 01001000 01100101 01101100 01101100 01101111
  5-bits: 01001 00001 10010 10110 11000 11011 00011 01111
  Waarden:    9      1     18     22     24     27      3     15
  Tekens:     J      B      S      W      Y      3      D      P

  Resultaat: "JBSWY3DP"`,
            },
            {
              title: 'Base32-alfabet',
              body: 'Gebruikt alleen <strong>A–Z</strong> en <strong>2–7</strong>. Cijfers 0 en 1 zijn uitgesloten om verwarring met O en I te vermijden. Altijd hoofdletters.',
              table: { headers: ['Waarden', 'Tekens'], rows: [['0–25','A–Z'],['26–31','2–7']] },
            },
            {
              title: 'Grootteratio',
              body: 'Base32-uitvoer is <strong>⌈n/5⌉ × 8</strong> tekens — ongeveer 60% groter dan de invoer.',
              example:
`   5 bytes →  8 tekens
  10 bytes → 16 tekens
   3 bytes →  8 tekens  (met 6 × '=' opvulling)`,
            },
          ],
        },
      ],
    },
    {
      title: 'Praktische snelkoppelingen',
      cards: [
        {
          title: 'Snelle controles die je mentaal kunt uitvoeren',
          rules: [
            {
              title: 'Even of oneven',
              body: 'Laatste binaire bit: <strong>0 = even, 1 = oneven</strong>. Laatste hexadecimaal cijfer even (0,2,4,6,8,A,C,E) = even getal.',
            },
            {
              title: 'Deelbaar door machten van 2',
              body: 'Een getal is deelbaar door 2ⁿ als de laatste <strong>n binaire bits</strong> allemaal nul zijn.',
              example:
`  0b10110100 — laatste 2 bits zijn 00 → deelbaar door 4
  0xAF80     — laatste hex-cijfer 0  → deelbaar door 16`,
            },
            {
              title: 'Hex ↔ Decimaal voor losse cijfers',
              body: 'A=10, B=11, C=12, D=13, E=14, F=15. Voor tweedelig hex: <strong>eerste cijfer × 16 + tweede cijfer</strong>. Bijv. 0xFF = 15×16+15 = 255.',
            },
            {
              title: 'Veelvoorkomende waarden om in één oogopslag te herkennen',
              table: {
                headers: ['Decimaal', 'Hex', 'Binair', 'Noten'],
                rows: [
                  ['255',   '0xFF',   '11111111',         '8-bit maximum, volle byte'],
                  ['256',   '0x100',  '100000000',        '2⁸, één byte overflow'],
                  ['127',   '0x7F',   '01111111',         'INT8_MAX'],
                  ['128',   '0x80',   '10000000',         'INT8 tekenbit'],
                  ['1024',  '0x400',  '10000000000',      '2¹⁰, "één K"'],
                  ['65535', '0xFFFF', '1111111111111111', '16-bit maximum'],
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};

const LANGS: Record<Lang, Translation> = { en: EN, nl: NL };
