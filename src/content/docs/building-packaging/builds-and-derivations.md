---
title: Building Software with Nix
description: Derivations, fetchers, helpers, overlays, and real-world packaging patterns
---

# Building Software with Nix: Derivations and Overlays

This section focuses on **how software actually gets built in Nix**.

The goal is not to memorize helpers, but to understand:

- what a derivation is
- how sources enter the system
- how build helpers reduce boilerplate
- how overlays let you modify builds safely
- and where common pitfalls live

---

## 1. What a Derivation Really Is

A derivation is a **pure description of a build**, not the build itself.

Conceptually:

```

(inputs) + (build instructions) → derivation → build → /nix/store/…

```

In Nix code, a derivation is just an attrset produced by `mkDerivation` (or helpers built on top of it).

Key points:

- Evaluation creates a derivation (cheap, fast)
- Building executes it (expensive, sandboxed)
- Derivations are immutable and content-addressed

---

## 2. `stdenv.mkDerivation`: The Foundation

Most build helpers ultimately call:

```nix
pkgs.stdenv.mkDerivation
```

A minimal example:

### `src/hello.c`

```c
#include <stdio.h>

int main(int argc, char *argv[]) {
    const char *name = (argc > 1) ? argv[1] : "world";
    printf("hello, %s!\n", name);
    return 0;
}
```

### Derivation

```nix
pkgs.stdenv.mkDerivation {
  pname = "hello-c";
  version = "1.0";

  src = ./src;

  nativeBuildInputs = [ pkgs.gcc ];

  buildPhase = ''
    gcc hello.c -o hello
  '';

  installPhase = ''
    mkdir -p $out/bin
    cp hello $out/bin/
  '';

  meta = {
    description = "Simple hello world C program";
  };
}
```

Important attributes you’ll see constantly:

- `pname`, `version`
- `src`
- `buildInputs`
- `nativeBuildInputs`
- `phases` / `installPhase`
- `meta`

---

## 3. Fetchers: How Source Code Enters Nix

Fetchers are **fixed-output derivations**: they download something and verify its hash.

### Common fetchers

- `fetchFromGitHub`
- `fetchgit`
- `fetchurl`
- `fetchzip`

Example:

```nix
src = pkgs.fetchFromGitHub {
  owner = "rakyll";
  repo = "hey";
  rev = "v0.1.4";
  hash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
};
```

Key rules:

- Hashes are mandatory (reproducibility)
- Hash mismatch errors are part of the workflow
- Fetchers run at build time, not eval time

---

## 4. Build Helpers: Reducing Boilerplate

Most real packages do **not** use `mkDerivation` directly.

Instead, nixpkgs provides _build helpers_ that encode conventions.

### Common helpers you’ll encounter

- `buildGoModule`
- `buildPythonPackage`
- `buildRustPackage`
- `buildNpmPackage`
- `cmake`, `meson`, `autotools` helpers

Example (Go):

```nix
pkgs.buildGoModule {
  pname = "hey";
  version = "1.0";

  src = pkgs.fetchFromGitHub {
    owner = "rakyll";
    repo = "hey";
    rev = "v0.1.4";
    hash = pkgs.lib.fakeHash;
  };

  vendorHash = pkgs.lib.fakeHash;
}
```

Helpers:

- define standard phases
- set environment variables
- handle language-specific tooling
- reduce copy/paste

---

## 5. Script Builders and Text Builders

Not everything is “compile a big project”.

Nix excels at **small glue tools**.

### `writeShellApplication`

Best for small CLI tools:

```nix
pkgs.writeShellApplication {
  name = "hello";
  text = ''
    echo "hello from nix"
  '';
}
```

Features:

- wraps runtime dependencies automatically
- clean, declarative
- preferred over raw `mkDerivation` for scripts

---

### `writeText` / `writeTextFile`

For generating config or data:

```nix
pkgs.writeText "config.txt" ''
  port=8080
''
```

These return **store paths**, not strings.

---

## 6. Runtime vs Build-Time Dependencies

This is a daily source of confusion.

### `nativeBuildInputs`

- tools needed **to build**
- run on the build machine

### `buildInputs`

- libraries or tools needed **at runtime**

Rule of thumb:

- compilers, code generators → `nativeBuildInputs`
- shared libraries, interpreters → `buildInputs`

---

## 7. Wrapping Programs and Runtime Environment

Many programs expect:

- `PATH`
- `PYTHONPATH`
- `SSL_CERT_FILE`
- etc.

Nix does not provide these implicitly.

### `wrapProgram`

```nix
wrapProgram $out/bin/mytool \
  --prefix PATH : ${pkgs.python3}/bin
```

This creates a wrapper script that:

- sets environment variables
- then execs the real program

This is how Nix makes programs self-contained.

---

## 8. Overlays: Modifying the Package Set

Overlays are **functions that transform the package set**.

Signature:

```nix
self: super: { … }
```

- `super` → original package set
- `self` → package set _with_ your overlay applied

Example:

```nix
self: super: {
  hello = super.hello.overrideAttrs (_: {
    pname = "hello-custom";
  });
}
```

Overlays are used to:

- patch packages
- change versions
- inject custom builds
- experiment without forking nixpkgs

---

## 9. `override` vs `overrideAttrs` (Recap)

- `override` → change **function arguments**
- `overrideAttrs` → change **derivation attributes**

Mental model:

```
(args) → function → derivation
  ↑                    ↑
override         overrideAttrs
```

If you remember nothing else, remember that diagram.

---

## 10. `callPackage` and Dependency Injection

`callPackage` automatically fills function arguments from `pkgs`.

Instead of:

```nix
import ./pkg.nix { inherit pkgs; }
```

You write:

```nix
pkgs.callPackage ./pkg.nix {}
```

This:

- reduces boilerplate
- makes overrides easier
- is the standard nixpkgs style

---

## 11. Common Day-to-Day Pitfalls

These come up constantly:

- Using strings where paths are required
- Forgetting runtime dependencies
- Assuming `/usr/bin/env` exists
- Confusing eval-time vs build-time
- Overriding the wrong layer (args vs attrs)
- Not checking `meta.platforms`

None of these are “advanced” mistakes — they’re normal.

---

## 12. How nixpkgs Is Structured (Big Picture)

Understanding this helps you _read_ code:

- `pkgs/top-level/` → package set assembly
- `pkgs/build-support/` → helpers
- `pkgs/development/` → language ecosystems
- `pkgs/tools/` → CLI tools

Most “magic” is just layered functions.

---

## Exercises

### Exercise 1: Fetcher Practice

- Use `fetchFromGitHub` with a fake hash
- Build once
- Replace the hash from the error

---

### Exercise 2: Helper Selection

Given three projects:

- a Go CLI
- a Python library
- a shell script

Decide:

- which build helper to use
- or whether to avoid `mkDerivation` entirely

Explain _why_.

---

### Exercise 3: Overlay Refactor

- Take an existing package
- Modify one argument via `override`
- Modify one derivation attribute via `overrideAttrs`
- Verify which changes require rebuilding dependents

---

## Mental Models to Keep

- A derivation is a _description_, not an action
- Fetchers define trust boundaries
- Helpers encode conventions, not magic
- Overlays are transformations, not patches
- Evaluation is cheap; builds are expensive

---

## Closing Thought

If flakes define **what your project is**,
derivations define **how your software exists**.

Once you’re comfortable here, you can build almost anything with Nix.
