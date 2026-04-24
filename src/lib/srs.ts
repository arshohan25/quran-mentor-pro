/**
 * SM-2 spaced repetition algorithm.
 * Quality scale: 0=again, 3=hard, 4=good, 5=easy.
 */

export interface SrsCard {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string; // ISO
  last_quality: number | null;
  last_reviewed_at: string | null;
}

export type Quality = 0 | 3 | 4 | 5;

export const QUALITY_LABELS: Record<Quality, { en: string; bn: string }> = {
  0: { en: "Again", bn: "আবার" },
  3: { en: "Hard", bn: "কঠিন" },
  4: { en: "Good", bn: "ভালো" },
  5: { en: "Easy", bn: "সহজ" },
};

export function defaultCard(): SrsCard {
  return {
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review_at: new Date().toISOString(),
    last_quality: null,
    last_reviewed_at: null,
  };
}

export function reviewCard(card: SrsCard, quality: Quality): SrsCard {
  let { ease_factor, interval_days, repetitions } = card;

  if (quality < 3) {
    // Failed — reset repetitions, short interval
    repetitions = 0;
    interval_days = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval_days = 1;
    else if (repetitions === 2) interval_days = 3;
    else interval_days = Math.round(interval_days * ease_factor);

    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;
  }

  const next = new Date();
  next.setDate(next.getDate() + interval_days);

  return {
    ease_factor,
    interval_days,
    repetitions,
    next_review_at: next.toISOString(),
    last_quality: quality,
    last_reviewed_at: new Date().toISOString(),
  };
}

export function isDue(card: SrsCard, now: Date = new Date()): boolean {
  return new Date(card.next_review_at).getTime() <= now.getTime();
}
