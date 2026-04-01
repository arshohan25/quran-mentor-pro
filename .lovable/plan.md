

# Rebuild Mushaf ReadingView — Exact Quran.com Clone from Screenshots

## Key Differences (Current vs Screenshots)

| Point | Screenshot (Quran.com) | Current App |
|-------|----------------------|-------------|
| **Surah Header** | Calligraphic Arabic name (left) + "1. Al-Fatihah / The Opener" (right) + teal "info" badge | Bordered frame, centered |
| **Al-Fatihah layout** | Each ayah on its own line, centered, larger font | Flowing paragraph like all surahs |
| **Verse markers** | Circular ornamental markers (۝) with Arabic numbers | Plain `﴿١﴾` text brackets |
| **Page number** | Teal/cyan colored number at bottom | White/muted number |
| **Bottom separator** | Thin horizontal line below page number | None |
| **Background** | Dark gray ~`#1C1C2E` | `#1B1B2F` (close, minor tweak) |
| **Bismillah** | Part of ayah 1 with verse marker (for Fatihah) | Separate decorative element |

## Plan

### 1. Rewrite `ReadingView.tsx` — Complete Overhaul

**Surah Header (Quran.com style)**:
- Left side: Calligraphic Arabic surah name (large, Scheherazade New)
- Right side: "{number}. {englishName}" bold + "{englishNameTranslation}" smaller below + teal "info" badge
- No bordered frame, no center alignment

**Al-Fatihah Special Layout**:
- Detect short surahs (Fatihah specifically) — render each ayah on its own centered line
- Larger font size for short surahs
- Bismillah is NOT separate — it's part of the API text for ayah 1

**Body Text (longer surahs)**:
- Flowing RTL justified paragraph (same as current)
- Font: Scheherazade New, default ~26px

**Verse Markers**:
- Use Unicode end-of-ayah sign with Arabic numerals inside circular markers
- Style: slightly smaller than body text, same white color, inline

**Page Number**:
- Teal/cyan colored (like `#008374` or similar)
- Centered at bottom
- Horizontal separator line below

**Navigation**: Keep existing prev/next bottom bar

### 2. Files Changed

- `src/components/quran/ReadingView.tsx` — Complete rewrite matching screenshots exactly

