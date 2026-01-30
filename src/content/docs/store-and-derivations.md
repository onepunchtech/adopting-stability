---
title: The Nix Store and Derivations
description: A high-level, hands-on tour of /nix/store and derivations—the core building blocks behind reproducible builds.
---

This page introduces two foundational concepts:

- The **Nix store**: where build outputs live
- **Derivations**: structured build recipes that produce those outputs

The goal here is _intuition_, not mastery. We’ll run commands and inspect real outputs.

---

## What Is the Nix Store?

The Nix store is a content-addressed filesystem location where Nix places **immutable build results**.

Typical paths look like:

```

/nix/store/<hash>-name-version

```

The hash encodes (directly or indirectly) the build’s inputs. If the inputs change, the store path changes.

### Explore the store

```bash
ls -ld /nix/store
ls /nix/store | head
```

You’ll see many entries. Each is an artifact Nix can reference safely because it won’t be mutated in place.

### Store paths are immutable

Try to modify something in `/nix/store`:

```bash
echo "test" | sudo tee /nix/store/should-fail 2>/dev/null || true
```

Depending on OS/install mode you’ll get a permissions error. The point: **the store is not your workspace**.

---

## How Nix Exposes Store Outputs to You

You don’t normally use store paths directly. Instead, Nix creates _references_ to store paths via profiles and environments.

### Find the current profile (common on Linux/macOS)

```bash
ls -l ~/.nix-profile 2>/dev/null || true
ls -l /nix/var/nix/profiles/per-user/$USER 2>/dev/null || true
```

### Install a tool into a temporary environment and find it

```bash
nix shell nixpkgs#hello -c which hello
nix shell nixpkgs#hello -c hello
```

Now inspect where that binary came from:

```bash
nix shell nixpkgs#hello -c sh -lc 'readlink -f "$(which hello)"'
```

You should see a path under `/nix/store/...`.

---

## Store Paths Encode “Identity”

A key Nix feature is that multiple versions can coexist safely. Nothing is overwritten.

### Compare two versions (example with jq)

```bash
nix shell nixpkgs/nixos-23.11#jq -c jq --version
nix shell nixpkgs/nixos-24.05#jq -c jq --version
```

Now show where each one lives:

```bash
nix shell nixpkgs/nixos-23.11#jq -lc 'readlink -f "$(which jq)"'
nix shell nixpkgs/nixos-24.05#jq -lc 'readlink -f "$(which jq)"'
```

Different versions → different store paths.

> If the store path changes, something about the inputs changed.

---

## Dependency Closures: What Does This Binary _Actually_ Depend On?

Nix can show the full dependency closure of a store path.

### Get the store path of a package

```bash
HELLO_PATH="$(nix path-info nixpkgs#hello)"
echo "$HELLO_PATH"
```

### Show its runtime closure

```bash
nix path-info -r "$HELLO_PATH" | head -n 20
```

Count how many store paths are in the closure:

```bash
nix path-info -r "$HELLO_PATH" | wc -l
```

> This is one of the superpowers of Nix: you can ask _exactly_ what something depends on.

### Show why a dependency exists (optional)

Sometimes you want to know _why_ some store path is in the closure.

```bash
# Does not depend

nix why-depends \
  "$(nix build --no-link --print-out-paths 'nixpkgs#ripgrep.out')" \
  "$(nix build --no-link --print-out-paths 'nixpkgs#bash.out')"


# Does depend
nix why-depends \
  "$(nix build --no-link --print-out-paths 'nixpkgs#bashInteractive.out')" \
  "$(nix build --no-link --print-out-paths 'nixpkgs#bash.out')"

```

Note: `why-depends` is very useful, but can be noisy and sometimes surprises people. Use as a “stretch” demo.

---

## What Is a Derivation?

A **derivation** is a structured build recipe: inputs, environment, builder, and declared outputs.

You can think of it as:

```
Derivation: “Given these inputs, run this builder to produce these outputs”
```

Derivations are the unit Nix can:

- cache
- build
- substitute from a binary cache
- reproduce elsewhere

---

## Inspect a Derivation (Hands-On)

### 1) Get the store path for hello

```bash
HELLO_OUT="$(nix build --no-link --print-out-paths nixpkgs#hello)"
echo "$HELLO_OUT"
```

This returns the output path (a store path).

### 2) Show the derivation(s) associated with that output

```bash
nix path-info --derivation "$HELLO_OUT"
```

You’ll get a `.drv` path (a derivation in the store).

Save it:

```bash
HELLO_DRV="$(nix path-info --derivation "$HELLO_OUT")"
echo "$HELLO_DRV"
```

### 3) Show what’s inside the derivation

```bash
nix derivation show "$HELLO_DRV" | head -n 40
```

What to look for:

- `outputs` (often `out`)
- `inputDrvs` / `inputSrcs`
- builder and environment variables
- system/platform

### 4) Show the build-time closure of the derivation

```bash
nix-store -q --references "$HELLO_DRV" 2>/dev/null | head -n 20
```

Depending on platform, `nix-store` might not be present or might be discouraged with the new CLI.

---

## Evaluation vs Realization (A Useful Mental Model)

Nix has two major phases:

- **Evaluation**: compute the build graph / derivations
- **Realization**: actually build or substitute outputs

### Demo: “evaluate without building”

You can often show the shape of things without performing a build by using inspection commands (`nix derivation show`, `nix flake show`, etc.).

Try:

```bash
nix derivation show "$(nix path-info --derivation "$(nix path-info nixpkgs#hello)")" | head -n 20
```

---

## Build Reproducibility: Inputs → Output Path

Nix makes a strong promise:

- If inputs are the same, the output path is stable.
- If inputs differ, the output path changes.

### Demo: same output via two commands

These should produce the same output store path:

```bash
nix path-info nixpkgs#hello
nix build --no-link --print-out-paths nixpkgs#hello
```

### Demo: change the input (revision) changes output

Pin hello from different nixpkgs revisions:

```bash
nix build --no-link --print-out-paths nixpkgs/nixos-23.11#hello
nix build --no-link --print-out-paths nixpkgs/nixos-24.05#hello
```

Different outputs are expected.

---

## How This Enables Caching

Because Nix can compute an output identity from its inputs, it can safely reuse cached results.

### Check for cache/substitution behavior

Build hello twice:

```bash
nix build --no-link nixpkgs#hello
nix build --no-link nixpkgs#hello
```

The second run should be fast. Often it will say it’s “already built” or simply do nothing.

You can also observe downloads vs builds in the output logs.

---

## Practical Takeaways

- `/nix/store` is an immutable content-addressed store of build results
- Store paths are “build identities”—they change when inputs change
- A derivation (`.drv`) is the structured recipe that produces store outputs
- Nix can show complete dependency closures, which helps with:

  - debugging
  - auditing
  - reproducibility
  - CI caching strategies

---

## More Exercises

### A) Compare closures of two packages

```bash
nix path-info -r nixpkgs#hello | wc -l
nix path-info -r nixpkgs#python3 | wc -l
```

Discuss why one closure is much larger.

### B) Find which dependencies are shared

```bash
comm -12 \
  <(nix path-info -r nixpkgs#hello | sort) \
  <(nix path-info -r nixpkgs#jq | sort) | head
```

### C) Garbage collection preview

```bash
nix store gc --dry-run
```
