// Every newly claimed analysis reserves the full $0.10 run ceiling, including failures.
// Replays/busy responses do not reserve again. Rolling windows use the database clock.
export const ANALYSIS_USER_LIMITS = { perHour: 10, perDay: 30 } as const;
