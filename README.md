# Fresh Vim Text Objects

A small [Fresh Editor](https://getfresh.dev/) plugin that adds interactive Vim-inspired text-object selection for paired delimiters.

It provides two commands:

- **Vim: Select Inside** — select the content between a matching pair, without including the delimiters.
- **Vim: Select Around** — select the complete pair, including its opening and closing delimiters.

The plugin is written in TypeScript and uses Fresh's plugin API.

## Features

- Select inside or around matching delimiters.
- Supports braces, brackets, parentheses, quotes, backticks and angle brackets.
- Finds the closest matching pair that contains the cursor.
- Handles nested pairs of the same delimiter type.
- Ignores escaped quote characters.
- Converts between Fresh's UTF-8 byte offsets and JavaScript's UTF-16 string indexes when locating the selection.

## Supported delimiters

| Input | Matching pair |
| --- | --- |
| `(` or `)` | `()` |
| `[` or `]` | `[]` |
| `{` or `}` | `{}` |
| `"` | `""` |
| `'` | `''` |
| `` ` `` | `` `` `` |
| `<` or `>` | `<>` |

You can enter either the opening or closing character when prompted.

## Installation

### Install from GitHub

1. Open Fresh's command palette with `Ctrl+P`.
2. Run **Package: Install from URL**.
3. Enter the repository URL:

   `https://github.com/elenarc-dev/fresh-select-text-objects-plugin`

### Install from a local directory

Clone the repository:

```bash
git clone https://github.com/elenarc-dev/fresh-select-text-objects-plugin.git
```

Then use **Package: Install from URL** in Fresh and provide the local directory containing `package.json`.

## Usage

Place the cursor anywhere inside the delimiter pair you want to select.

### Select inside

Run **Vim: Select Inside** from the command palette.

The plugin prompts for a delimiter. Enter one of the supported characters to select the content between the matching delimiters.

For example, with the cursor inside:

```typescript
const message = greet("Fresh Editor");
```

Entering `(` selects:

```text
"Fresh Editor"
```

### Select around

Run **Vim: Select Around** from the command palette.

Enter a supported delimiter to select the content together with its opening and closing delimiters.

Using the same example, entering `(` selects:

```text
("Fresh Editor")
```

The selection is created using Fresh's editor actions.

## How matching works

The plugin reads the active buffer and searches for the closest matching pair of the requested delimiter type that contains the cursor.

For brackets, braces and parentheses, it uses a stack to match nested occurrences of the same delimiter. For quotes, it pairs unescaped occurrences sequentially.

The cursor and selection calculations account for the difference between UTF-8 byte offsets (used by the editor API) and UTF-16 string indexes (used by JavaScript).

## Limitations

- Matching is delimiter-based, not syntax-aware. The plugin does not use a parser or Tree-sitter to determine whether a character is actually acting as a delimiter in the current language.
- Nested matching is handled for occurrences of the same delimiter type; mixed delimiter nesting is not validated as a complete syntax structure.
- Quote matching pairs unescaped occurrences sequentially. It does not parse language-specific string syntax, comments, or multiline-string rules.
- Angle brackets can be ambiguous in languages where they are also used for comparisons or generic type parameters.
- Only the active buffer is considered.

If no matching pair is found, the plugin reports this in the editor status bar. Unsupported input is also reported there.

## Development

The repository contains the plugin entry point, package manifest and TypeScript configuration.

Requirements:

- [Fresh Editor](https://getfresh.dev/)
- Node.js and npm (to install the development dependency)
- TypeScript 6

Install the development dependency:

```bash
npm install
```

Run the TypeScript compiler in check-only mode:

```bash
npx tsc --noEmit
```

The plugin entry point is `vim-select-text-object.ts`. Its package manifest is `package.json`.

## License

The package metadata declares the project as MIT-licensed. A `LICENSE` file is not currently included in the repository.
