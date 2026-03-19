---
title: "Editor Setup"
description: "Configure the Kōdo Language Server for VSCode, Neovim, Helix, and other editors"
---

# Editor Setup

The Kōdo Language Server (`kodoc lsp`) brings real-time feedback directly into your editor. For AI agents operating through IDE integrations, LSP quality is a critical factor — hover information, diagnostics, and code actions form the tight feedback loop that enables agents to write correct code faster.

## VSCode Setup

There is no VSCode extension on the marketplace yet. You can connect to the Kōdo LSP manually using a generic LSP client extension.

### Installation

1. **Install the Kōdo compiler** — follow the [Installation guide](/docs/getting-started/) to build or install `kodoc`.

2. **Ensure `kodoc` is in your PATH**:

   ```bash
   kodoc --version
   ```

3. **Install a generic LSP client** — for example, [vscode-languageclient](https://marketplace.visualstudio.com/items?itemName=APerezGarcia.vscode-generic-lsp-client) or any extension that lets you configure a custom language server.

4. **Configure the LSP server** — point it to `kodoc lsp` as the command. Associate `.ko` files with the server.

5. **Open a `.ko` file** — you should see diagnostics, hover information, and completions.

### What You Get

Once the LSP is connected, every `.ko` file you open benefits from:

- Red/yellow squiggles on errors and warnings, updated as you type
- Hover tooltips showing types, contracts, and agent annotations
- Autocomplete suggestions for functions, structs, enums, and builtins
- One-click quick fixes for common issues
- Outline view showing module structure

## Available Features

### Diagnostics

The LSP reports parse errors and type errors in real time. Errors appear as you type, with source spans mapped to the exact location in your file. When `--json-errors` is used from the CLI, the same structured error data powers the LSP diagnostics.

Each diagnostic includes:
- The error code (e.g., `E0200` for type errors)
- A human-readable message with the source span highlighted
- Severity level (error or warning)

### Hover

Hovering over a symbol shows detailed information depending on what you are pointing at:

- **Functions**: signature, parameter types, return type, contracts (`requires`/`ensures`), and all annotations
- **Parameters**: name and declared type (e.g., `param count: Int`)
- **Variables**: name and type, inferred from the initializer if no explicit annotation is present (e.g., `let x: Int`)

### Completions

Context-aware completions are provided for:

- **31 built-in functions** with full signature details (e.g., `println`, `file_read`, `sqrt`)
- **User-defined functions** with contract information shown in the detail
- **Struct and enum names** defined in the current module
- **Enum variants** after typing `EnumName::` — shows all variants with their field types
- **String methods** and **struct field** completions

### Go to Definition

Jump to the definition of any function, variable, parameter, struct, or enum. Works within the current module. Press `F12` or `Ctrl+Click` / `Cmd+Click` on an identifier.

### Find References

Find all usages of a symbol across the current document. Supports the `include_declaration` option to also highlight the definition site. Use `Shift+F12` in VSCode.

### Rename

Rename a symbol and all its references within the document. Press `F2` on any identifier to rename it consistently.

### Signature Help

When typing inside a function call, parameter hints appear showing the expected argument types. This activates automatically after typing `(` or `,`.

### Document Symbols

The outline view (`Ctrl+Shift+O` / `Cmd+Shift+O`) shows all declarations in the module — functions, structs, enums — for quick navigation.

### Code Actions (Quick Fixes)

The LSP provides code actions that appear as lightbulb suggestions:

- **Add missing contract** — for functions that have no `requires` or `ensures` clauses, suggests adding a contract skeleton
- **Add type annotation** — for `let` bindings without an explicit type, suggests adding the inferred type
- **Fix patches from the type checker** — machine-applicable fixes for type errors, provided as one-click workspace edits

## Agent-First Features

Kōdo's LSP is designed with AI agents as first-class consumers. Several features surface agent-specific metadata that no other language server provides.

### Annotation-Aware Hover

When you hover over a function that has agent annotations, the LSP displays them with their full arguments:

- `@confidence(0.95)` — the declared confidence score, not just the annotation name
- `@authored_by(agent: "claude")` — the authoring agent with its identifier
- `@reviewed_by(reviewer: "human")` — review status

This means an agent (or a human reviewing agent-written code) can see trust metadata without opening the source file.

### Structured Diagnostics

All diagnostics emitted by the LSP carry the same structured data available through `kodoc check --json-errors`. This includes:

- Error codes that agents can classify and act on
- Source spans with byte offsets for machine-applicable patches
- Fix suggestions that map directly to `kodoc fix` patches

### Custom LSP Extensions

The Kōdo LSP exposes two custom request methods beyond the standard protocol:

| Method | Description |
|--------|-------------|
| `/kodo/contractStatus` | Returns the verification status of all contracts in the current file |
| `/kodo/confidenceReport` | Returns confidence scores for all functions, mirroring `kodoc confidence-report --json` |

These extensions allow AI agents connected via LSP to query trust and correctness metadata programmatically, without invoking the CLI.

## Other Editors

The Kōdo LSP server communicates over stdin/stdout using the standard Language Server Protocol. Any editor with LSP support can connect to it.

### Neovim

Using [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig), add a custom server configuration:

```lua
local lspconfig = require('lspconfig')
local configs = require('lspconfig.configs')

if not configs.kodo then
  configs.kodo = {
    default_config = {
      cmd = { 'kodoc', 'lsp' },
      filetypes = { 'kodo' },
      root_dir = lspconfig.util.find_git_ancestor,
      settings = {},
    },
  }
end

lspconfig.kodo.setup({})
```

You may also want to associate `.ko` files with the `kodo` filetype:

```lua
vim.filetype.add({
  extension = {
    ko = 'kodo',
  },
})
```

### Helix

Add the following to your `languages.toml`:

```toml
[[language]]
name = "kodo"
scope = "source.kodo"
file-types = ["ko"]
language-servers = ["kodo-lsp"]
comment-token = "//"

[language-server.kodo-lsp]
command = "kodoc"
args = ["lsp"]
```

### Zed

In your Zed settings, add a custom language server:

```json
{
  "lsp": {
    "kodo": {
      "binary": {
        "path": "kodoc",
        "arguments": ["lsp"]
      }
    }
  }
}
```

### Generic LSP Client

For any other editor or tool, start the server with:

```bash
kodoc lsp
```

The server reads JSON-RPC messages from stdin and writes responses to stdout, following the [LSP specification](https://microsoft.github.io/language-server-protocol/).

## Next Steps

- [CLI Reference](../cli-reference) — full list of `kodoc` commands and flags
- [CLI Tools](../cli-tools) — built-in functions for file I/O, math, and process control
- [Agent Traceability](../agent-traceability) — `@confidence`, `@authored_by`, and compilation certificates
