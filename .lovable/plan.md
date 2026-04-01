

# Add Stylish Bengali Font

## Current State
The app uses **Noto Sans Bengali** — a clean but plain sans-serif Bengali font. For a more stylish, decorative feel, we'll add **Hind Siliguri** (modern, clean) or **Galada** (calligraphic, decorative) or **Anek Bangla** (elegant variable font).

## Recommendation
Add **Hind Siliguri** as the primary Bengali font (modern, highly readable, stylish) and **Galada** as an optional decorative/display font for headings.

## Changes

### 1. `src/index.css` (line 1)
- Update Google Fonts import to include `Hind+Siliguri:wght@300;400;500;600;700` and `Galada`

### 2. `tailwind.config.ts`
- Update `fontFamily.bengali` to `["Hind Siliguri", "Noto Sans Bengali", "sans-serif"]`
- Add `fontFamily.bengaliDisplay` as `["Galada", "cursive"]` for decorative headings

### 3. `src/index.css` body rule
- Update the body font-family to use Hind Siliguri as primary

### 4. Optional: Key headings
- Use `font-bengaliDisplay` (Galada) on the app title in `Index.tsx` for a stylish look

