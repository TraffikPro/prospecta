export class DeadlineError extends Error {
  readonly code = "TIMEOUT" as const;

  constructor() {
    super("TIMEOUT");
    this.name = "DeadlineError";
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof DeadlineError ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export async function runWithTimeout<T>(
  work: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  parent: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onParent = () => controller.abort();
  if (parent.aborted) {
    controller.abort();
  } else {
    parent.addEventListener("abort", onParent, { once: true });
  }

  try {
    return await new Promise<T>((resolve, reject) => {
      const fail = () => reject(new DeadlineError());
      if (controller.signal.aborted) {
        fail();
        return;
      }
      controller.signal.addEventListener("abort", fail, { once: true });
      work(controller.signal).then(
        (value) => {
          controller.signal.removeEventListener("abort", fail);
          resolve(value);
        },
        (error: unknown) => {
          controller.signal.removeEventListener("abort", fail);
          reject(error);
        },
      );
    });
  } finally {
    clearTimeout(timer);
    parent.removeEventListener("abort", onParent);
  }
}
