import { BASES, Base, BaseInfo, convertAll } from './converter';
import './styles.css';

/* ── State ──────────────────────────────────────────────────── */
let currentBase: Base = 'decimal';
let theme: 'dark' | 'light' = 'dark';

/* ── Bootstrap ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderShell();
  switchTab('converter');
});

/* ── Shell ──────────────────────────────────────────────────── */
function renderShell() {
  document.getElementById('app')!.innerHTML = `
    <header class="header">
      <div class="header-title">
        the-<span class="accent">bestest</span>-number-system-converter
      </div>
      <div class="header-actions">
        <button class="btn" id="theme-btn">☀ Light</button>
      </div>
    </header>
    <nav class="tabs">
      <button class="tab-btn" data-tab="converter">Converter</button>
      <button class="tab-btn" data-tab="tricks">Mental Tricks</button>
    </nav>
    <main class="main" id="main"></main>
  `;

  document.getElementById('theme-btn')!.addEventListener('click', toggleTheme);
  document.querySelector('.tabs')!.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-tab]') as HTMLElement | null;
    if (btn) switchTab(btn.dataset.tab as 'converter' | 'tricks');
  });
}

function switchTab(tab: 'converter' | 'tricks') {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', (b as HTMLElement).dataset.tab === tab);
  });
  if (tab === 'converter') renderConverter();
  else renderTricks();
}

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  document.getElementById('theme-btn')!.textContent = theme === 'dark' ? '☀ Light' : '☽ Dark';
}

/* ── Converter Tab ──────────────────────────────────────────── */
function renderConverter() {
  const main = document.getElementById('main')!;
  main.innerHTML = `
    <div class="input-section">
      <div class="field-group input-wrapper">
        <label class="field-label" for="val-input">Value</label>
        <input
          class="input-field"
          id="val-input"
          type="text"
          spellcheck="false"
          autocomplete="off"
          placeholder="Enter a value…"
        />
      </div>
      <div class="field-group">
        <label class="field-label" for="base-select">Input base</label>
        <select class="select-field" id="base-select">
          ${BASES.map(b => `<option value="${b.id}" ${b.id === currentBase ? 'selected' : ''}>${b.label} — ${b.description}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="error-banner" id="error-banner" style="display:none"></div>
    <div class="info-bar hidden" id="info-bar">
      <span>Bits: <span class="val" id="info-bits">—</span></span>
      <span>Bytes: <span class="val" id="info-bytes">—</span></span>
    </div>
    <div class="output-grid" id="output-grid">
      ${renderOutputGrid('', null)}
    </div>
  `;

  document.getElementById('val-input')!.addEventListener('input', onInput);
  document.getElementById('base-select')!.addEventListener('change', onBaseChange);
  document.getElementById('output-grid')!.addEventListener('click', onCopyClick);
}

function onInput(e: Event) {
  updateOutputs((e.target as HTMLInputElement).value);
}

function onBaseChange(e: Event) {
  currentBase = (e.target as HTMLSelectElement).value as Base;
  const val = (document.getElementById('val-input') as HTMLInputElement).value;
  updateOutputs(val);
}

function onCopyClick(e: Event) {
  const btn = (e.target as HTMLElement).closest('.copy-btn') as HTMLElement | null;
  if (!btn || btn.hasAttribute('disabled')) return;
  const text = btn.dataset.value ?? '';
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 1500);
  });
}

function updateOutputs(value: string) {
  const input = document.getElementById('val-input') as HTMLInputElement;
  const errorBanner = document.getElementById('error-banner')!;
  const infoBar = document.getElementById('info-bar')!;
  const grid = document.getElementById('output-grid')!;

  const result = convertAll(value, currentBase);

  if (result.error) {
    input.classList.add('is-error');
    errorBanner.style.display = 'flex';
    errorBanner.textContent = '⚠ ' + result.error;
    infoBar.classList.add('hidden');
  } else {
    input.classList.remove('is-error');
    errorBanner.style.display = 'none';
    if (result.bytes && result.byteLength > 0) {
      infoBar.classList.remove('hidden');
      document.getElementById('info-bits')!.textContent = String(result.bitLength);
      document.getElementById('info-bytes')!.textContent = String(result.byteLength);
    } else {
      infoBar.classList.add('hidden');
    }
  }

  grid.innerHTML = renderOutputGrid(value, result.error ? null : result.outputs);
}

function renderOutputGrid(inputValue: string, outputs: Record<string, string> | null): string {
  return BASES.map((b: BaseInfo) => {
    const val = outputs ? outputs[b.id] : '';
    const isSource = b.id === currentBase && inputValue.trim() !== '';
    const isEmpty = !val;
    const displayVal = val || (outputs ? '—' : '');

    return `
      <div class="output-card ${isSource ? 'is-source' : ''} ${isEmpty && outputs ? 'is-empty' : ''}">
        <div class="card-head">
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span class="card-label">${b.shortLabel}</span>
            <span class="card-desc">${b.label}${b.prefix ? '' : ''} · ${b.description}</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.35rem">
            ${b.prefix ? `<span class="prefix-chip">${b.prefix}</span>` : ''}
            ${isSource ? '<span class="prefix-chip" style="color:var(--accent);border-color:var(--accent)">source</span>' : ''}
          </div>
        </div>
        <div class="card-body">
          <span class="output-value">${escHtml(displayVal)}</span>
          <button
            class="copy-btn"
            data-value="${escAttr(val)}"
            ${!val ? 'disabled' : ''}
            title="Copy to clipboard"
          >Copy</button>
        </div>
      </div>
    `;
  }).join('');
}

/* ── Mental Tricks Tab ──────────────────────────────────────── */
function renderTricks() {
  const main = document.getElementById('main')!;
  main.innerHTML = `
    <div class="tricks-intro">
      Mental shortcuts for converting between number systems by hand.
      Each section covers one conversion pair with step-by-step rules and worked examples.
    </div>
    ${TRICKS.map(section => `
      <div class="tricks-section">
        <div class="tricks-section-title">${escHtml(section.title)}</div>
        ${section.cards.map((card, i) => `
          <div class="trick-card" id="trick-${section.title.replace(/\s/g,'-')}-${i}">
            <div class="trick-head" data-trick="trick-${section.title.replace(/\s/g,'-')}-${i}">
              <span class="trick-title">${escHtml(card.title)}</span>
              <span class="trick-arrow">▼</span>
            </div>
            <div class="trick-body">
              ${card.rules.map(rule => `
                <div class="trick-rule">
                  <div class="trick-rule-title">${escHtml(rule.title)}</div>
                  ${rule.body ? `<div class="trick-text">${rule.body}</div>` : ''}
                  ${rule.example ? `<pre class="trick-example">${escHtml(rule.example)}</pre>` : ''}
                  ${rule.table ? renderTable(rule.table) : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `).join('')}
  `;

  main.addEventListener('click', (e) => {
    const head = (e.target as HTMLElement).closest('.trick-head') as HTMLElement | null;
    if (!head) return;
    const id = head.dataset.trick!;
    document.getElementById(id)!.classList.toggle('open');
  });
}

function renderTable(table: { headers: string[]; rows: string[][] }): string {
  return `
    <table class="trick-table">
      <thead><tr>${table.headers.map(h => `<th>${escHtml(h)}</th>`).join('')}</tr></thead>
      <tbody>${table.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  `;
}

/* ── Tricks Content ─────────────────────────────────────────── */
interface TrickRule {
  title: string;
  body?: string;
  example?: string;
  table?: { headers: string[]; rows: string[][] };
}
interface TrickCard { title: string; rules: TrickRule[]; }
interface TrickSection { title: string; cards: TrickCard[]; }

const TRICKS: TrickSection[] = [
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
                ['0000','0','','1000','8'],
                ['0001','1','','1001','9'],
                ['0010','2','','1010','A'],
                ['0011','3','','1011','B'],
                ['0100','4','','1100','C'],
                ['0101','5','','1101','D'],
                ['0110','6','','1110','E'],
                ['0111','7','','1111','F'],
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
                ['16⁰','1'],
                ['16¹','16'],
                ['16²','256'],
                ['16³','4,096'],
                ['16⁴','65,536'],
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
`  3 bytes → 4 chars    (ratio 4/3)
  6 bytes → 8 chars
  9 bytes → 12 chars
  10 bytes → 16 chars  (padded)`,
          },
        ],
      },
      {
        title: 'Base64 alphabet reference',
        rules: [
          {
            title: 'Key anchor values to memorize',
            body: 'You don\'t need the full table by heart — anchor on these ranges:',
            table: {
              headers: ['Value range', 'Characters', 'Notes'],
              rows: [
                ['0–25', 'A–Z', 'Uppercase letters'],
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
            body: 'Uses only <strong>A–Z</strong> and <strong>2–7</strong> (not 0, 1, 8, 9). Digits 0 and 1 are excluded to avoid confusion with O and I. Always uppercase.',
            table: {
              headers: ['Values', 'Chars'],
              rows: [
                ['0–25', 'A–Z'],
                ['26–31', '2–7'],
              ],
            },
          },
          {
            title: 'Size ratio',
            body: 'Base32 output is <strong>⌈n/5⌉ × 8</strong> characters — roughly 60% larger than the input. More human-readable than Base64 but less space-efficient.',
            example:
`  5 bytes  →  8 chars
  10 bytes → 16 chars
  3 bytes  →  8 chars  (with 6 × '=' padding)`,
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
            body: 'A number is divisible by 2ⁿ if its last <strong>n binary bits</strong> are all zero, or equivalently its last <strong>⌈n/4⌉ hex digits</strong> are zero (for multiples of 4 bits).',
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
                ['255', '0xFF', '11111111', '8-bit max, full byte'],
                ['256', '0x100', '100000000', '2⁸, one byte overflow'],
                ['127', '0x7F', '01111111', 'INT8_MAX'],
                ['128', '0x80', '10000000', 'INT8 sign bit'],
                ['1024', '0x400', '10000000000', '2¹⁰, "one K"'],
                ['65535', '0xFFFF', '1111111111111111', '16-bit max'],
              ],
            },
          },
        ],
      },
    ],
  },
];

/* ── Utilities ──────────────────────────────────────────────── */
function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
