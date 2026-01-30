---
title: Purity and Explicit Inputs
description: Why Nix enforces strict boundaries (purity) and how explicit inputs enable reproducible builds and correct caching.
---

This page explains a core Nix idea:

> **Reproducible builds require controlling what information a build is allowed to see.**

Nix is “strict” on purpose. That strictness is what enables:

- reproducibility
- correct caching
- predictable upgrades
- fewer “it worked yesterday” failures

We’ll keep this high-level but hands-on, using commands that reveal what Nix is doing.

---

## What “Purity” Means (Practically)

When we say “pure” in the Nix context, we mean:

- **No hidden dependencies**
- **No ambient state**
- **No implicit filesystem probing**
- **No network access during builds (by default)**
- The build is a function of declared inputs

In a pure build, _if something influences the output, it should be declared as an input_.

---

## The Basic Problem: Scripts Can See the Whole World

A typical build script can accidentally depend on:

- whatever is on your PATH
- whatever is installed globally
- what time it is
- what DNS resolves to today
- what happens to be on disk

That makes builds:

- hard to reproduce
- hard to cache correctly
- hard to debug

Nix’s solution is: **restrict what the build can see**.

---

## A Mental Model You Can Reuse

### Build as a function

```

(output) = build(inputs)

```

If you can’t enumerate the inputs, you can’t claim reproducibility.

---

## Evaluation vs Build: Where Purity Applies

Nix has two important phases:

1. **Evaluation (pure)**: compute a build graph from expressions
2. **Realization (sandboxed)**: run builders with only declared inputs available

We won’t write Nix code yet—this page is about behaviors you can observe.

---

## Demo 1: “If It’s Not an Input, It Doesn’t Exist”

This is the most important lived experience for new Nix users.

### Step 1: Get a temporary shell with only one tool

```bash
nix shell nixpkgs#bashInteractive -c bash
```

Inside that shell, run:

```bash
which git || echo "git is not available"
which curl || echo "curl is not available"
which python || echo "python is not available"
```

Now exit:

```bash
exit
```

**What this demonstrates**:

- your environment can be intentionally minimal
- “I assumed X existed” becomes an explicit choice

### Step 2 (optional): Add tools explicitly

```bash
nix shell nixpkgs#bashInteractive nixpkgs#git nixpkgs#curl -c bash
```

Now:

```bash
which git
which curl
```

> Nix makes you declare tools because undeclared tools are hidden dependencies.

---

## Demo 2: Dependency Closure is Explicit (and Inspectable)

A big reason purity works is that Nix can _compute the full closure_ of a package.

### Pick a package and inspect its closure

```bash
HELLO="$(nix path-info nixpkgs#hello)"
echo "$HELLO"
nix path-info -r "$HELLO" | head -n 20
```

Now compare with a larger package:

```bash
PY="$(nix path-info nixpkgs#python3)"
nix path-info -r "$PY" | wc -l
nix path-info -r "$HELLO" | wc -l
```

**What this demonstrates**:

- dependency graphs are explicit
- you can audit and reason about “what’s included”
- inputs are not hidden in global state

---

## Demo 3: “Purity” Enables Correct Caching

Traditional build caching is often heuristic (“did files change?”).
Nix caching can be _correct_ because the cache key comes from inputs.

### Show that the output identity is stable

```bash
nix build --no-link --print-out-paths nixpkgs#hello
nix build --no-link --print-out-paths nixpkgs#hello
```

Second run should be instant.

### Show that changing inputs changes outputs

```bash
nix build --no-link --print-out-paths nixpkgs/nixos-23.11#hello
nix build --no-link --print-out-paths nixpkgs/nixos-24.05#hello
```

Different inputs ⇒ different output paths. That’s an important guarantee.

---

## What Counts as an “Input”?

This is where teams often underestimate the problem.
Inputs include more than direct dependencies.

### Examples of inputs (often forgotten)

- Source code (obvious)
- Build tools (make, cmake, maven, gradle)
- Compiler toolchain (gcc/clang/jdk)
- System libraries (openssl, libc, zlib)
- Environment variables that influence the build
- Patches applied during build
- Configuration flags
- The platform/architecture

Nix works because it tries to make these explicit.

---

## Demo 4: Hidden Dependency on PATH (Simple Illustration)

This demo shows why “ambient PATH” is a build hazard.

### Outside nix: what tools are on your PATH?

```bash
command -v gcc || true
command -v make || true
command -v python || true
command -v openssl || true
```

Now create a very minimal Nix environment and re-check:

```bash
nix shell nixpkgs#bashInteractive -c sh -lc 'command -v python || echo "no python"; command -v gcc || echo "no gcc"; command -v openssl || echo "no openssl"'
```

Now add them explicitly:

```bash
nix shell nixpkgs#bashInteractive nixpkgs#gcc nixpkgs#openssl nixpkgs#python -c sh -lc 'command -v gcc; command -v openssl; command -v python3'
```

**Lesson**:

- in Nix, _ambient availability disappears_
- build dependencies become deliberate

---

## Demo 5: Network Access and “Impure Inputs”

One of the biggest sources of non-reproducibility is downloading things during a build.

### The principle

> If a build needs the internet, the internet becomes an input.

Nix generally pushes network access _out of the build step_ and into controlled fetchers.

### Identify that fetchers are separate steps

Run:

```bash
nix build --no-link nixpkgs#hello -L
```

Watch whether it:

- downloads a substitute (binary cache)
- or performs local builds

Either way, Nix is trying to ensure the _artifact_ is a known result, not “whatever the internet served today.”

> Note: Nix can still download sources/binaries, but it does so in a controlled way that can be hashed and cached.

---

## Demo 6: “Impure” Builds as a Contrast

Nix has an “impure” mode for evaluation and some commands. This is useful as a contrast.

### Evaluate with and without impurity (flake example)

Try showing that Nix can reference the current directory as an input:

```bash
pwd
ls
```

Then:

```bash
nix flake show
```

Now compare with:

```bash
nix flake show --impure
```

Depending on your flake and environment, this might not change output—so treat it as optional. The takeaway is:

- **pure evaluation** discourages implicit dependency on “whatever directory I’m in”
- `--impure` exists, but it’s a tradeoff

---

## The Big Tradeoff: Strictness vs Convenience

This is where you acknowledge the pain point honestly.

### What purity costs you

- You must declare tools/dependencies
- Some “quick hacks” stop working
- You occasionally need to fight the build boundary

### What purity buys you

- Builds become explainable
- Bugs become repeatable
- Caches become reliable
- Upgrades become mechanical (bump inputs → build/test → promote)

> Nix doesn’t remove work. It removes classes of _compensatory work_.

---

## How This Connects to Real Org Problems

Purity + explicit inputs is what makes these possible:

- **Onboarding**: “enter the dev shell” replaces multi-page setup docs
- **CI parity**: same inputs in CI and local
- **Safer upgrades**: build/test matrices reveal breakage immediately
- **CVE response**: update inputs, rebuild everything, promote green

---

## Practical Takeaways

- Reproducible builds require controlling _what a build can see_
- “Explicit inputs” is not ceremony—it’s how you make builds predictable
- Nix’s strictness is what enables:

  - correct caching
  - reliable reproduction
  - safer upgrades
