---
title: Using Nix Day-to-Day
description: Common, practical ways developers use Nix in daily workflows without rewriting everything.
---

This page focuses on **how Nix fits into everyday development work**.

You don’t need to “go all in” on Nix to get value. Many teams start by using Nix as:

- a tool installer
- a dev environment manager
- a way to make workflows predictable

We’ll explore common patterns and commands you can use immediately.

---

## Mental Model: Nix as a Tool, Not a Lifestyle

You can think of Nix as:

- a **package runner** (`nix run`)
- a **temporary environment** (`nix shell`)
- a **build orchestrator** (`nix build`)

All of these can coexist with your existing tools.

---

## Running Tools Without Installing Them

One of the fastest wins with Nix is running tools without modifying your system.

### Run a tool once

```bash
nix run nixpkgs#ripgrep -- --version
```

This:

- downloads the tool if needed
- runs it
- leaves your system unchanged

### Run a specific version

```bash
nix run nixpkgs/nixos-23.11#ripgrep -- --version
```

### Compare with your system version

```bash
rg --version || echo "ripgrep not installed globally"
```

> This is especially useful for CI parity and trying tools safely.

---

## Temporary Shell Environments

Temporary shells are a common daily workflow.

### Create a shell with specific tools

```bash
nix shell nixpkgs#git nixpkgs#jq nixpkgs#curl
```

Now check what’s available:

```bash
which git
which jq
which curl
```

Exit the shell:

```bash
exit
```

### Use a shell to run a command

```bash
nix shell nixpkgs#nodejs -c node --version
```

---

## Why `nix shell` Is Different from Virtualenvs or Containers

- Tools are **explicitly declared**
- No activation scripts
- No mutation of global state
- Fast to enter and exit

> If it breaks, you exit the shell and you’re back to normal.

---

## Reproducible Project Environments

For projects, you usually want the same tools every time.

### Quick ad-hoc approach (no files yet)

```bash
nix shell nixpkgs#nodejs nixpkgs#pnpm nixpkgs#jq
```

### Move toward a project file (preview)

Later, this becomes:

```bash
nix develop
```

(with configuration living in the repo)

We’ll cover this more in **Dev Environments** and **Flakes**.

---

## Running Existing Build Tools Inside Nix

Nix works well with existing ecosystems.

### Java example

```bash
nix shell nixpkgs#jdk17 nixpkgs#maven -c mvn test
```

### Node example

```bash
nix shell nixpkgs#nodejs nixpkgs#npm -c npm test
```

### Python example

```bash
nix shell nixpkgs#python3 -c python --version
```

> The important thing: the _toolchain_ becomes reproducible, even if the build system stays the same.

## Working with Multiple Versions Side by Side

Nix makes it easy to compare versions.

### Run two versions of the same tool

```bash
nix shell nixpkgs/nixos-23.11#nodejs -c node --version
nix shell nixpkgs/nixos-24.05#nodejs -c node --version
```

### Use different versions in different projects

No global installs. No conflicts.

---

## Using Nix in CI Locally

Many teams first adopt Nix by matching CI locally.

### Example: mimic a CI environment

```bash
nix shell nixpkgs#jdk17 nixpkgs#maven nixpkgs#git -c bash
```

Then run the same commands CI runs.

> “Works in this shell” becomes meaningful.

---

## When Things Go Wrong (Normalizing Failure)

Nix failures often feel abrupt at first.

### Common failure modes

- missing dependency
- build blocked from accessing something
- wrong version pinned

These are signals, not random breakage.

### Debug approach

- read the error
- identify what input is missing
- add it explicitly

> Nix failures usually mean “you forgot to declare something.”

---

## Patterns That Scale Well

These patterns tend to work across teams:

- Use `nix run` for one-off tools
- Use `nix shell` for ad-hoc environments
- Use `nix develop` for project environments
- Keep Nix usage near the edges at first

---

## What You Don’t Need to Do Yet

You do _not_ need to:

- package everything
- write complex Nix code
- adopt NixOS
- replace your build system

> Early success comes from using Nix as a helper, not a replacement.

---

## Optional Exercises

### A) Run a tool you don’t normally have

```bash
nix run nixpkgs#terraform -- version
```

### B) Create a shell and inspect PATH differences

```bash
env | grep PATH
nix shell nixpkgs#jq -c 'env | grep PATH'
```

### C) Compare system vs Nix-provided tool

```bash
which git
nix shell nixpkgs#git -c which git
```

---

## Practical Takeaways

- Nix can be useful without full adoption
- Day-to-day workflows focus on `run`, `shell`, and `develop`
- Explicit environments reduce surprise
- You can add structure gradually
