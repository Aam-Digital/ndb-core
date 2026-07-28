import * as readline from "readline";

/**
 * A readline session that stays open across several questions. Closing and
 * reopening the interface between questions discards whatever stdin has already
 * buffered, which loses answers as soon as input arrives faster than the
 * prompts (piped input, or fast typing). The interface is created on first use
 * so commands that never ask anything don't hold stdin open.
 */
export function createPromptSession() {
  let rl: readline.Interface | undefined;
  let lines: AsyncIterator<string> | undefined;
  function ensureOpen(): readline.Interface {
    rl ??= readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    // The async iterator queues lines that arrive before their question is
    // asked, which `rl.question` drops. It also ends cleanly at EOF instead
    // of leaving the callback — and the command — hanging forever.
    lines ??= rl[Symbol.asyncIterator]();
    return rl;
  }
  return {
    async ask(question: string): Promise<string> {
      ensureOpen();
      process.stdout.write(question + " ");
      const next = await lines!.next();
      return next.done ? "" : next.value;
    },
    /**
     * Like {@link ask}, but suppresses the echo of what's typed — for
     * passphrases. When `input` is a TTY, readline echoes each keystroke
     * itself (it puts the terminal in raw mode and handles editing/echo
     * directly, rather than relying on the OS), so muting its output
     * function for the duration hides the answer from the screen and
     * scrollback without changing how it's read. Piped, non-TTY input has no
     * echo to suppress, so this is a no-op there.
     */
    async askHidden(question: string): Promise<string> {
      const session = ensureOpen();
      process.stdout.write(question + " ");
      const sessionAny = session as unknown as {
        _writeToOutput?: (s: string) => void;
      };
      const original = sessionAny._writeToOutput;
      sessionAny._writeToOutput = () => {};
      try {
        const next = await lines!.next();
        return next.done ? "" : next.value;
      } finally {
        sessionAny._writeToOutput = original;
        process.stdout.write("\n");
      }
    },
    close(): void {
      rl?.close();
      rl = undefined;
      lines = undefined;
    },
  };
}

export type PromptSession = ReturnType<typeof createPromptSession>;

export async function askYesNo(
  prompt: PromptSession,
  question: string,
): Promise<boolean> {
  const answer = (await prompt.ask(question)).toLowerCase();
  return answer === "y" || answer === "yes";
}

export async function askConfirmation(question: string): Promise<boolean> {
  const prompt = createPromptSession();
  try {
    return await askYesNo(prompt, question);
  } finally {
    prompt.close();
  }
}
