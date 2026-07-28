import {
  dedupeSignals,
  signalLabel as catalogSignalLabel,
} from "./signal-catalog";

/**
 * @deprecated Prefer importing from `./signal-catalog`.
 * Kept as a thin re-export for existing call sites.
 */
export function signalLabel(signal: string): string {
  return catalogSignalLabel(signal);
}

export { dedupeSignals };
