import { BASES, Base, convertAll } from './converter';
import { Lang, TrickRule, TrickSection, setLang, t } from './i18n';
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
        <select class="select-sm" id="lang-select" title="Language / Taal">
          <option value="en">🇬🇧 EN</option>
          <option value="nl">🇳🇱 NL</option>
        </select>
        <button class="btn" id="theme-btn">${t().themeLight}</button>
      </div>
    </header>
    <nav class="tabs">
      <button class="tab-btn" data-tab="converter">${t().tabConverter}</button>
      <button class="tab-btn" data-tab="tricks">${t().tabTricks}</button>
    </nav>
    <main class="main" id="main"></main>
  `;

  document.getElementById('theme-btn')!.addEventListener('click', toggleTheme);
  document.getElementById('lang-select')!.addEventListener('change', onLangChange);
  document.querySelector('.tabs')!.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-tab]') as HTMLElement | null;
    if (btn) switchTab(btn.dataset.tab as 'converter' | 'tricks');
  });
}

let activeTab: 'converter' | 'tricks' = 'converter';

function switchTab(tab: 'converter' | 'tricks') {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', (b as HTMLElement).dataset.tab === tab);
  });
  if (tab === 'converter') renderConverter();
  else renderTricks();
}

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  document.getElementById('theme-btn')!.textContent =
    theme === 'dark' ? t().themeLight : t().themeDark;
}

function onLangChange(e: Event) {
  setLang((e.target as HTMLSelectElement).value as Lang);
  refreshShellText();
  if (activeTab === 'converter') translateConverterInPlace();
  else renderTricks();
}

function translateConverterInPlace() {
  const tr = t();

  const valLabel = document.querySelector('label[for="val-input"]');
  if (valLabel) valLabel.textContent = tr.labelValue;

  const baseLabel = document.querySelector('label[for="base-select"]');
  if (baseLabel) baseLabel.textContent = tr.labelInputBase;

  const valInput = document.getElementById('val-input') as HTMLInputElement | null;
  if (valInput) valInput.placeholder = tr.placeholder;

  const baseSelect = document.getElementById('base-select') as HTMLSelectElement | null;
  if (baseSelect) {
    BASES.forEach((b, i) => {
      const bl = tr.bases[b.id];
      if (baseSelect.options[i]) baseSelect.options[i].text = `${bl.label} — ${bl.description}`;
    });
  }

  // Update info bar label text nodes (structure: "Bits: <span>…</span>")
  const infoBitsSpan = document.getElementById('info-bits');
  if (infoBitsSpan?.parentElement?.childNodes[0])
    infoBitsSpan.parentElement.childNodes[0].textContent = `${tr.bits}: `;
  const infoBytesSpan = document.getElementById('info-bytes');
  if (infoBytesSpan?.parentElement?.childNodes[0])
    infoBytesSpan.parentElement.childNodes[0].textContent = `${tr.bytes}: `;

  // Re-render output cards with new language (preserves input element)
  updateOutputs(lastInputValue);
}

function refreshShellText() {
  const tr = t();
  document.getElementById('theme-btn')!.textContent =
    theme === 'dark' ? tr.themeLight : tr.themeDark;
  document.querySelectorAll('.tab-btn').forEach(b => {
    const tab = (b as HTMLElement).dataset.tab as 'converter' | 'tricks';
    b.textContent = tab === 'converter' ? tr.tabConverter : tr.tabTricks;
  });
}

/* ── Converter Tab ──────────────────────────────────────────── */
let lastInputValue = '';

function renderConverter() {
  const tr = t();
  const main = document.getElementById('main')!;
  main.innerHTML = `
    <div class="input-section">
      <div class="field-group input-wrapper">
        <label class="field-label" for="val-input">${escHtml(tr.labelValue)}</label>
        <input
          class="input-field"
          id="val-input"
          type="text"
          spellcheck="false"
          autocomplete="off"
          placeholder="${escAttr(tr.placeholder)}"
          value="${escAttr(lastInputValue)}"
        />
      </div>
      <div class="field-group">
        <label class="field-label" for="base-select">${escHtml(tr.labelInputBase)}</label>
        <select class="select-field" id="base-select">
          ${BASES.map(b => {
            const bl = tr.bases[b.id];
            return `<option value="${b.id}" ${b.id === currentBase ? 'selected' : ''}>${escHtml(bl.label)} — ${escHtml(bl.description)}</option>`;
          }).join('')}
        </select>
      </div>
    </div>
    <div class="error-banner" id="error-banner" style="display:none"></div>
    <div class="info-bar hidden" id="info-bar">
      <span>${escHtml(tr.bits)}: <span class="val" id="info-bits">—</span></span>
      <span>${escHtml(tr.bytes)}: <span class="val" id="info-bytes">—</span></span>
    </div>
    <div class="output-grid" id="output-grid">
      ${renderOutputCards(lastInputValue, null)}
    </div>
  `;

  const input = document.getElementById('val-input') as HTMLInputElement;
  input.addEventListener('input', onInput);
  document.getElementById('base-select')!.addEventListener('change', onBaseChange);
  document.getElementById('output-grid')!.addEventListener('click', onCopyClick);

  if (lastInputValue) updateOutputs(lastInputValue);
}

function onInput(e: Event) {
  lastInputValue = (e.target as HTMLInputElement).value;
  updateOutputs(lastInputValue);
}

function onBaseChange(e: Event) {
  currentBase = (e.target as HTMLSelectElement).value as Base;
  updateOutputs(lastInputValue);
}

function onCopyClick(e: Event) {
  const btn = (e.target as HTMLElement).closest('.copy-btn') as HTMLElement | null;
  if (!btn || btn.hasAttribute('disabled')) return;
  const text = btn.dataset.value ?? '';
  const tr = t();
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = tr.copied;
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = tr.copy;
      btn.classList.remove('copied');
    }, 1500);
  });
}

function updateOutputs(value: string) {
  const input = document.getElementById('val-input') as HTMLInputElement;
  const errorBanner = document.getElementById('error-banner')!;
  const infoBar = document.getElementById('info-bar')!;
  const grid = document.getElementById('output-grid')!;
  const tr = t();

  const result = convertAll(value, currentBase);

  if (result.error) {
    input.classList.add('is-error');
    errorBanner.style.display = 'flex';
    errorBanner.textContent = '⚠ ' + tr.formatError(result.error);
    infoBar.classList.add('hidden');
    grid.innerHTML = renderOutputCards(value, null);
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
    grid.innerHTML = renderOutputCards(value, result.outputs);
  }
}

function renderOutputCards(inputValue: string, outputs: Record<string, string> | null): string {
  const tr = t();
  return BASES.map(b => {
    const bl = tr.bases[b.id];
    const val = outputs ? outputs[b.id] : '';
    const isSource = b.id === currentBase && inputValue.trim() !== '';
    const isEmpty = !val;

    return `
      <div class="output-card ${isSource ? 'is-source' : ''} ${isEmpty && outputs ? 'is-empty' : ''}">
        <div class="card-head">
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span class="card-label">${b.shortLabel}</span>
            <span class="card-desc">${escHtml(bl.label)} · ${escHtml(bl.description)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.35rem">
            ${b.prefix ? `<span class="prefix-chip">${escHtml(b.prefix)}</span>` : ''}
            ${isSource ? `<span class="prefix-chip" style="color:var(--accent);border-color:var(--accent)">${escHtml(tr.source)}</span>` : ''}
          </div>
        </div>
        <div class="card-body">
          <span class="output-value">${escHtml(val || (outputs ? '—' : ''))}</span>
          <button
            class="copy-btn"
            data-value="${escAttr(val)}"
            ${!val ? 'disabled' : ''}
            title="${escAttr(tr.copy)}"
          >${escHtml(tr.copy)}</button>
        </div>
      </div>
    `;
  }).join('');
}

/* ── Mental Tricks Tab ──────────────────────────────────────── */
function renderTricks() {
  const tr = t();
  const main = document.getElementById('main')!;
  main.innerHTML = `
    <div class="tricks-intro">${escHtml(tr.tricksIntro)}</div>
    ${tr.tricks.map((section: TrickSection, si: number) => `
      <div class="tricks-section">
        <div class="tricks-section-title">${escHtml(section.title)}</div>
        ${section.cards.map((card, ci) => {
          const id = `trick-${si}-${ci}`;
          return `
            <div class="trick-card" id="${id}">
              <div class="trick-head" data-trick="${id}">
                <span class="trick-title">${escHtml(card.title)}</span>
                <span class="trick-arrow">▼</span>
              </div>
              <div class="trick-body">
                ${card.rules.map((rule: TrickRule) => `
                  <div class="trick-rule">
                    <div class="trick-rule-title">${escHtml(rule.title)}</div>
                    ${rule.body ? `<div class="trick-text">${rule.body}</div>` : ''}
                    ${rule.example ? `<pre class="trick-example">${escHtml(rule.example)}</pre>` : ''}
                    ${rule.table ? renderTable(rule.table) : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `).join('')}
  `;

  main.addEventListener('click', (e) => {
    const head = (e.target as HTMLElement).closest('.trick-head') as HTMLElement | null;
    if (!head) return;
    document.getElementById(head.dataset.trick!)!.classList.toggle('open');
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

/* ── Utilities ──────────────────────────────────────────────── */
function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s: string): string {
  return s.replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
