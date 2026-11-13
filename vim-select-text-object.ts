
const editor = getEditor();

type Delimiter = {
  open: string;
  close: string;
};

const delimiters: Record<string, Delimiter> = {
  "{": { open: "{", close: "}" },
  "}": { open: "{", close: "}" },
  "[": { open: "[", close: "]" },
  "]": { open: "[", close: "]" },
  "(": { open: "(", close: ")" },
  ")": { open: "(", close: ")" },
  '"': { open: '"', close: '"' },
  "'": { open: "'", close: "'" },
  "`": { open: "`", close: "`" },
  "<": { open: "<", close: ">" },
  ">": { open: "<", close: ">" },
};

// UTF-8 byte length of a JavaScript string.
function utf8Length(text: string): number {
  let bytes = 0;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);

    if (code <= 0x7f) {
      bytes += 1;
    } else if (code <= 0x7ff) {
      bytes += 2;
    } else if (
      code >= 0xd800 &&
      code <= 0xdbff &&
      i + 1 < text.length &&
      text.charCodeAt(i + 1) >= 0xdc00 &&
      text.charCodeAt(i + 1) <= 0xdfff
    ) {
      bytes += 4;
      i++;
    } else {
      bytes += 3;
    }
  }

  return bytes;
}

// Convert UTF-16 string index to UTF-8 byte offset.
function byteOffset(text: string, index: number): number {
  return utf8Length(text.slice(0, index));
}

// Convert UTF-8 byte offset to UTF-16 string index.
function utf16Index(text: string, bytePosition: number): number {
  let bytes = 0;
  let index = 0;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    let charBytes: number;
    let charLength = 1;

    if (code <= 0x7f) {
      charBytes = 1;
    } else if (code <= 0x7ff) {
      charBytes = 2;
    } else if (
      code >= 0xd800 &&
      code <= 0xdbff &&
      i + 1 < text.length &&
      text.charCodeAt(i + 1) >= 0xdc00 &&
      text.charCodeAt(i + 1) <= 0xdfff
    ) {
      charBytes = 4;
      charLength = 2;
    } else {
      charBytes = 3;
    }

    if (bytes + charBytes > bytePosition) {
      break;
    }

    bytes += charBytes;
    index += charLength;
    i += charLength - 1;
  }

  return index;
}

function isEscaped(text: string, index: number): boolean {
  let count = 0;

  for (
    let i = index - 1;
    i >= 0 && text[i] === "\\";
    i--
  ) {
    count++;
  }

  return count % 2 !== 0;
}

// Find the closest matching delimiter pair containing the cursor.
function findPair(
  text: string,
  cursor: number,
  delimiter: Delimiter,
): [number, number] | null {
  const { open, close } = delimiter;

  // Quotes.
  if (open === close) {
    const positions: number[] = [];

    for (let i = 0; i < text.length; i++) {
      if (
        text[i] === open &&
        !isEscaped(text, i)
      ) {
        positions.push(i);
      }
    }

    let best: [number, number] | null = null;

    for (let i = 0; i + 1 < positions.length; i += 2) {
      const start = positions[i];
      const end = positions[i + 1];

      if (start <= cursor && cursor <= end) {
        if (!best || end - start < best[1] - best[0]) {
          best = [start, end];
        }
      }
    }

    return best;
  }

  // Brackets, braces and parentheses.
  const stack: number[] = [];
  const pairs: Array<[number, number]> = [];

  for (let i = 0; i < text.length; i++) {
    if (text[i] === open) {
      stack.push(i);
    } else if (text[i] === close && stack.length > 0) {
      const start = stack.pop()!;
      pairs.push([start, i]);
    }
  }

  let best: [number, number] | null = null;

  for (const [start, end] of pairs) {
    if (start <= cursor && cursor <= end) {
      if (!best || end - start < best[1] - best[0]) {
        best = [start, end];
      }
    }
  }

  return best;
}

async function selectInteractive(around: boolean): Promise<void> {
  const character = await editor.prompt(
    around
      ? "Select around (character): "
      : "Select inside (character): ",
    "{"
  );

  if (!character || character.length !== 1) {
    return;
  }

  const delimiter = delimiters[character];

  if (!delimiter) {
    editor.setStatus(`Unsupported delimiter: ${character}`);
    return;
  }

  const bufferId = editor.getActiveBufferId();

  if (!bufferId) {
    return;
  }

  const text = await editor.getBufferText(bufferId);

  const cursorByte = editor.getCursorPosition();
  const cursor = utf16Index(text, cursorByte);

  const match = findPair(text, cursor, delimiter);

  if (!match) {
    editor.setStatus(`No matching ${character} found`);
    return;
  }

  const [openIndex, closeIndex] = match;

  const start = around
    ? openIndex
    : openIndex + delimiter.open.length;

  const end = around
    ? closeIndex + delimiter.close.length
    : closeIndex;

  const startByte = byteOffset(text, start);

  // Position cursor at selection start.
  editor.setBufferCursor(bufferId, startByte);

  await editor.flush();

  // Establish selection anchor and extend it.
  const characterCount = Array.from(
    text.slice(start, end)
  ).length;

  editor.executeActions([
    { action: "set_mark", count:1 },
    {
      action: "select_right",
      count: characterCount,
    },
  ]);

  editor.setStatus(
    `Selected ${delimiter.open}${delimiter.close}`
  );
}

// Register commands.
registerHandler("vim_select_inside", () => {
  void selectInteractive(false);
});

registerHandler("vim_select_around", () => {
  void selectInteractive(true);
});

editor.registerCommand(
  "Vim: Select Inside",
  "Select content inside a pair of delimiters",
  "vim_select_inside"
);

editor.registerCommand(
  "Vim: Select Around",
  "Select content including delimiters",
  "vim_select_around"
);

editor.setStatus("Vim Text Objects loaded");
