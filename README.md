# the-bestest-number-system-converter

A fast, sysadmin-aesthetic number system converter that runs entirely in the browser. No server, no telemetry, no nonsense.

## Supported bases

| Base | Prefix | Notes |
|------|--------|-------|
| Text (UTF-8) | — | Encode arbitrary strings |
| Binary (base-2) | `0b` | Auto-stripped on input |
| Octal (base-8) | `0o` | Auto-stripped on input |
| Decimal (base-10) | — | |
| Hexadecimal (base-16) | `0x` | Auto-stripped on input |
| Base32 | — | RFC 4648, uppercase A–Z + 2–7 |
| Base64 | — | Standard RFC 4648 with `+` and `/` |
| Base64url | — | URL-safe variant with `-` and `_`, no padding |

## Features

- **Instant conversion** — all bases update simultaneously as you type
- **Prefix auto-strip** — paste `0xFF` into Hex, it just works
- **Bit & byte length** display for every valid input
- **Copy-to-clipboard** on every output field
- **Dark / Light theme** toggle (defaults to dark)
- **Monospace font** throughout — sysadmin tool aesthetic
- **Mental Tricks page** — hand-conversion techniques for every supported base pair, with worked examples and lookup tables

## Stack

- TypeScript (no framework)
- Plain CSS with custom properties for theming
- Vite for bundling and dev server

## Getting started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Mental tricks

The **Mental Tricks** tab covers:

- Binary ↔ Decimal (positional weights, repeated halving)
- Binary ↔ Hex (nibble grouping — the key trick)
- Binary ↔ Octal (triad grouping)
- Hex ↔ Decimal (positional weights, repeated division)
- Base64 encoding/decoding algorithm and size ratios
- Base32 RFC 4648 algorithm and alphabet
- Practical shortcuts (even/odd, power-of-2 divisibility, common values on sight)
