
const editor = getEditor();

async function selectInteractive(around: boolean): Promise<void> {
  const character = await editor.prompt(
    around
      ? "Select around (character): "
      : "Select inside (character): ",
    "{"
  );

  if (character === null || character.length === 0) return;

  const delimiters: Record<string, [string, string]> = {
    "{": ["{", "}"],
    "}": ["{", "}"],
    "[": ["[", "]"],
    "]": ["[", "]"],
    "(": ["(", ")"],
    ")": ["(", ")"],
    '"': ['"', '"'],
    "'": ["'", "'"],
    "`": ["`", "`"],
    "<": ["<", ">"],
    ">": ["<", ">"],
  };

  const pair = delimiters[character];

  if (!pair) {
    editor.setStatus(`Unsupported delimiter: ${character}`);
    return;
  }

  const [open, close] = pair;

  const bufferId = editor.getActiveBufferId();
  if (!bufferId) return;

  const text = await editor.getBufferText(bufferId);
  const cursorByte = editor.getCursorPosition();
  const cursor = utf16Index(text, cursorByte);

  const delimiter = { open, close, label: character };
  const match = findPair(text, cursor, delimiter);

  if (!match) {
    editor.setStatus(`No matching ${character} found`);
    return;
  }

  const [openIndex, closeIndex] = match;

  const start = around ? openIndex : openIndex + open.length;
  const end = around ? closeIndex + close.length : closeIndex;

  const startByte = byteOffset(text, start);
  const endByte = byteOffset(text, end);

  editor.setBufferCursor(bufferId, startByte);
  await editor.flush();

  const characterCount = Array.from(text.slice(start, end)).length;

  editor.executeActions([
    { action: "set_mark" },
    { action: "select_right", count: characterCount },
  ]);

  editor.setStatus(`Selected ${open}${close}`);
}

registerHandler("vim_select_inside", () => {
  void selectInteractive(false);
});

registerHandler("vim_select_around", () => {
  void selectInteractive(true);
});

editor.registerCommand(
  "Vim: Select Inside",
  "Select inside a pair of delimiters",
  "vim_select_inside"
);

editor.registerCommand(
  "Vim: Select Around",
  "Select including delimiters",
  "vim_select_around"
);

