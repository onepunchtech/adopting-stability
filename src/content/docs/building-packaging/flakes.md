---
title: Flakes in Practice
description: Reproducible inputs, outputs, and daily workflows with Nix flakes
---

# What Are Flakes?

Flakes are a **structured, reproducible way to define Nix projects**.

A flake answers three core questions explicitly:

1. **What are my inputs?**  
   (nixpkgs, other flakes, local paths, Git repositories)
2. **What do I produce?**  
   (packages, dev shells, apps, checks)
3. **How do I make evaluation reproducible?**

At a high level, a flake turns a directory into a **self-contained, content-addressed unit**.

---

## Why flakes exist

Before flakes:

- `<nixpkgs>` came from `NIX_PATH`
- Inputs were implicit
- Reproducibility depended on environment state

With flakes:

- Inputs are explicit and pinned
- Paths inside the flake are tracked automatically
- Evaluation is pure by default
- Results are cacheable and shareable

A good mental model:

> **A flake is a pure function from inputs → outputs.**

---

## Anatomy of a flake

A minimal flake has one file:

```text
flake.nix
```

A typical structure looks like:

```text
.
├── flake.nix
├── flake.lock
├── shell.nix (optional, legacy)
└── src/
```

- `flake.nix` → definition
- `flake.lock` → pinned input versions (generated automatically)

---

## Init Flake Template

### Step 1: Initialize a flake

```bash
nix flake init
```

This creates a starter `flake.nix`.

A common minimal template looks like this:

```nix
{
  description = "My first flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = [ pkgs.hello ];
      };
    };
}
```

Key ideas:

- `inputs` declare _where code comes from_
- `outputs` is a function
- Everything is keyed by `system`

---

## Entering a Development Shell

```bash
nix develop
```

This:

- Evaluates the flake
- Builds dependencies if needed
- Drops you into a shell

You should now have `hello` available:

```bash
hello
```

---

## Modifying the Shell

Let’s make the shell more useful.

### Add common tools

```nix
devShells.${system}.default = pkgs.mkShell {
  packages = [
    pkgs.git
    pkgs.ripgrep
    pkgs.go
  ];
};
```

Re-enter the shell:

```bash
exit
nix develop
```

Changes are:

- reproducible
- versioned
- shared automatically

---

## Add Packages as Outputs

Flakes are not just for shells — they can **produce packages**.

### Add a `packages` output

```nix
outputs = { self, nixpkgs }:
let
  system = "x86_64-linux";
  pkgs = nixpkgs.legacyPackages.${system};
in
{
  packages.${system}.hello = pkgs.hello;

  packages.${system}.default = pkgs.hello;

  devShells.${system}.default = pkgs.mkShell {
    packages = [ pkgs.go ];
  };
};
```

Now you can:

```bash
nix build
```

or:

```bash
nix build .#hello
```

---

## How to Explore Outputs

```bash
nix flake show
```

This lists:

- packages
- devShells
- apps
- checks

This is your “API surface”.

---

# Exercises

These exercises are meant to be **hands-on and exploratory**.
You are expected to read errors, search nixpkgs, and iterate.

---

## Exercise 1: Build an open-source Go package using `buildGoPackage`

### Goal

Build a Go project from source and expose it as a flake package.

### Steps

1. Pick a small Go project from GitHub (single binary).
2. Use `pkgs.buildGoModule` (preferred over `buildGoPackage`).
3. Add it under `packages.${system}`.
4. Build it using `nix build`.

### Hints

Skeleton:

```nix
packages.${system}.my-go-tool = pkgs.buildGoModule {
  pname = "my-go-tool";
  version = "1.0.0";

  src = pkgs.fetchFromGitHub {
    owner = "...";
    repo = "...";
    rev = "...";
    sha256 = "...";
  };

  vendorHash = "...";
};
```

---

## Exercise 2: Build a Go package from a prebuilt binary

### Goal

Package a GitHub release binary instead of building from source.

### Steps

1. Find a GitHub release with Linux binaries.
2. Download the binary using `fetchurl`.
3. Install it using `stdenv.mkDerivation`.
4. Expose it as a flake package.

### Hints

```nix
packages.${system}.my-go-bin = pkgs.stdenv.mkDerivation {
  pname = "my-go-bin";
  version = "1.0.0";

  src = pkgs.fetchurl {
    url = "https://github.com/.../releases/download/...";
    sha256 = "...";
  };

  installPhase = ''
    mkdir -p $out/bin
    cp $src $out/bin/my-go-bin
    chmod +x $out/bin/my-go-bin
  '';
};
```

Verify with:

```bash
nix run .#my-go-bin
```

---

## 3) Package and expose a Python script that lives in your repo

### Goal

Expose a Python script **already present in your repository** as a flake package, without generating the script via Nix.

This teaches:

- packaging local sources
- putting repo files in `$out/bin`
- ensuring a runtime dependency (`python3`) is available

### Directory structure (example)

Create:

```text
.
├── flake.nix
├── src/
│   └── hello_tool/
│       ├── hello.py
│       └── __init__.py
```

### Example Python script: `src/hello_tool/hello.py`

```python
#!/usr/bin/env python3

import sys
from datetime import datetime

def main() -> int:
    name = sys.argv[1] if len(sys.argv) > 1 else "world"
    print(f"hello, {name}!")
    print(f"time: {datetime.now().isoformat(timespec='seconds')}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

Make it executable:

```bash
chmod +x src/hello_tool/hello.py
```

### Package it in `flake.nix`

Add this output:

```nix
packages.${system}.hello-py = pkgs.stdenvNoCC.mkDerivation {
  pname = "hello-py";
  version = "0.1.0";

  src = ./src/hello_tool/hello.py;
  dontUnpack = true;

  nativeBuildInputs = [ pkgs.makeWrapper ];

  installPhase = ''
    mkdir -p $out/bin
    install -m755 $src $out/bin/hello-py

    # Ensure python is available at runtime.
    # The script uses /usr/bin/env python3, so we wrap PATH.
    wrapProgram $out/bin/hello-py --prefix PATH : ${pkgs.python3}/bin
  '';
};
```

### Build and run

```bash
nix build .#hello-py
./result/bin/hello-py foobar
```

---

## Key Takeaways

- Flakes make inputs explicit and reproducible
- Outputs are a typed interface (packages, shells, apps)
- Everything is content-addressed
- `flake.lock` is a feature, not clutter
- Flakes scale from small scripts to large systems
