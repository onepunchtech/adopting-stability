---
title: Practical Nix Language for Daily Use
description: Debugging, composition, and real-world Nix workflows
---

This section focuses on how the Nix language is actually used in daily development:

- reading existing code
- debugging evaluation errors
- composing configurations
- working effectively with nixpkgs

The Nix language itself is small; the skill is learning how to _use it fluently_.

---

## 1. Reading and Navigating Existing Nix Code

Most Nix you interact with already exists. Your job is usually to:

- understand what shape a value has
- find where attributes come from
- determine where overrides apply

### Practical tips

- Start by identifying **the outermost attrset**
- Look for `let` bindings to see how values are assembled
- Ignore implementation details at first — focus on attribute names

Example:

```nix
let
  cfg = {
    enable = true;
    port = 8080;
  };
in
{
  service = cfg;
}
```

Focus first on:

- What attributes exist?
- What is the final shape?

### Exercise: Reading code

1. Open a Nix file from nixpkgs (any derivation).
2. Identify:

   - What arguments the file takes
   - What attrset it returns

3. Ignore build logic — just list the attribute names you see.

---

## 2. Documentation: Where to Look (and How)

Nix documentation is distributed and uneven — this is normal.

### Primary sources

- Nix language manual
- nixpkgs manual
- Source code (often the most accurate)

### Practical workflow

- Use `rg` (ripgrep) to search nixpkgs:

  ```bash
  rg mkDerivation
  rg callPackage
  rg mkIf
  ```

- Jump from usage → definition
- Read examples before reading prose

### Exercise: Finding documentation

1. Search for `lib.mkIf` in nixpkgs.
2. Find its definition.
3. Write a one-sentence description of what it does.

---

## 3. Tracing, Debugging, and Inspecting Values

Debugging is unavoidable in Nix.

### `builtins.trace`

```nix
builtins.trace "hello" value
```

This prints during evaluation _when the value is forced_.

### Showing stack traces

```bash
nix eval --show-trace ...
```

Always use this when debugging.

### REPL inspection

```bash
nix repl
:l <nixpkgs>
:p pkgs.hello
```

### Exercise: Tracing evaluation

```nix
let
  x = builtins.trace "evaluating x" 1;
  y = 2;
in
y
```

1. Evaluate this expression.
2. Observe that the trace does **not** print.
3. Change the expression so `x` is forced.

---

## 4. Laziness: Practical Consequences

Nix evaluates lazily. This affects:

- debugging
- conditionals
- error visibility

Example:

```nix
if false then throw "boom" else 42
```

This evaluates to `42`.

### Forcing Evaluation: seq vs deepSeq

Because Nix is lazy, values are not evaluated until needed.
Sometimes you want to force evaluation deliberately, usually for:

debugging

- surfacing errors early
- ensuring a value is “fully realized”
- Nix provides two related tools for this:

```nix
builtins.seq
builtins.deepSeq
```

`builtins.seq`: force just enough

```nix
builtins.seq a b
```

means:

Evaluate `a` to weak head normal form, then return `b`.

In practice:

- Nix evaluates a only far enough to know what it is
- It does not recursively evaluate inside attrsets or lists
- Example: seq does not force inside attrsets

```nix
let
  x = {
    a = throw "boom";
  };
in
builtins.seq x 42
```

✅ This evaluates to:

```nix
42
```

Why?

- x is an attrset
- seq only needs to know “this is an attrset”
- It does not evaluate `x.a`

Example: `seq` does force top-level expressions

```nix
builtins.seq (throw "boom") 42
```

❌ This throws:

```
error: boom
```

Because:

- The expression itself must be evaluated
- There’s no structure to defer inside

`builtins.deepSeq`: force everything

```nix
builtins.deepSeq a b
```

means:

Fully evaluate `a`, recursively, then return `b`.

This walks:

- attrsets
- lists
- nested structures
- and forces all values inside them.

Example: `deepSeq` forces nested values

```nix
let
  x = {
    a = throw "boom";
};
in
builtins.deepSeq x 42
```

❌ This throws:

```nix
error: boom
```

Because:

- `deepSeq` descends into x
- Forces `x.a`

Example: lists and laziness

```nix
let
  xs = [ 1 (throw "boom") 3 ];
in
builtins.seq xs 42
```

✅ Returns:

42

But:

```nix
builtins.deepSeq xs 42
```

❌ Throws:

```
error: boom
```

Again:

`seq` only checks “this is a list”
`deepSeq` evaluates every element
Each solves a different practical problem.

Use `seq` when you want to:

- force that something exists
- ensure a value is not bottom (throw, infinite recursion)
- trigger a trace at a specific point
- minimally disturb laziness

Use `deepSeq` when you want to:

- ensure a structure is fully valid
- surface errors hidden deep inside configs
- debug complex nested attrsets
- “validate” computed values

### Exercise: Laziness in action

1. Create a value that throws.
2. Reference it in an unused branch.
3. Force it using `seq`.

---

## 5. Attrsets as APIs and Interfaces

Attrsets define **contracts**.

### Defensive access

```nix
cfg.enable or false
cfg ? enable
```

### Defaults

```nix
{ enable ? false, ... }: enable
```

### Exercise: Designing an interface

1. Write a function that accepts `{ enable, port ? 8080 }`.
2. Return an attrset describing a service.
3. Call it with and without `port`.

---

## 6. Functions as Configuration Transformers

Functions are often used to **transform attrsets**.

```nix
cfg: cfg // { debug = true; }
```

This pattern underlies:

- overlays
- modules
- overrides

### Exercise: Layering config

1. Define a base config attrset.
2. Write a function that adds logging.
3. Apply it to the base config.

---

## 7. Evaluation vs Build Time

This distinction explains many errors.

### Evaluation time

- Running Nix expressions
- Computing values
- No side effects

### Build time

- Happens in a sandbox
- Happens _after_ evaluation
- Can run shell commands

### Exercise: Spot the phase

For each expression, decide:

- evaluation time or build time?

```nix
builtins.readFile ./file.txt
```

```nix
pkgs.stdenv.mkDerivation {
  buildPhase = "cat file.txt";
}
```

---

## 8. Paths, Strings, and the Store

Paths are tracked inputs. Strings are not.

### Correct

```nix
builtins.readFile ./config.txt
```

### Incorrect

```nix
builtins.readFile "./config.txt"
```

### Exercise: Path handling

1. Define a path using `./`.
2. Convert it to a string via interpolation.
3. Try to use it as a path again and observe the failure.

---

## 9. Working with `lib`

The `lib` attrset contains helpers you will use daily.

Common ones:

- `lib.optional`
- `lib.optionals`
- `lib.mkIf`
- `lib.attrsets`
- `lib.lists`

Example:

```nix
lib.optional cfg.enable pkgs.hello
```

### Exercise: Using `lib.optional`

1. Create a boolean flag.
2. Conditionally include a package in a list.
3. Toggle the flag and observe the result.

---

## 10. Overrides and Overlays

### `override` vs `overrideAttrs`

- `override` → function arguments
- `overrideAttrs` → derivation attributes

Example:

```nix
self: super: {
  hello = super.hello.overrideAttrs (_: {
    pname = "hello-custom";
  });
}
```

### Exercise: Applying an overlay

1. Create an overlay that renames hello.
2. Import nixpkgs with this overlay enabled.
3. Evaluate the package and confirm the name change.

---

## 11. Reading Error Messages

Common errors:

- `attribute 'x' missing`
- `attempt to call something which is not a function`
- infinite recursion

### Strategy

- Read the _first_ error
- Use `--show-trace`
- Look for the _shape mismatch_

### Exercise: Break things on purpose

1. Call an attrset like a function.
2. Access a missing attribute.
3. Practice reading the error messages.

---

## 12. Refactoring Nix Code Safely

Refactoring usually means:

- introducing `let`
- extracting functions
- reducing duplication

### Example

Before:

```nix
{ pkgs }: {
  a = pkgs.hello;
  b = pkgs.hello;
}
```

After:

```nix
{ pkgs }:
let
  hello = pkgs.hello;
in
{
  a = hello;
  b = hello;
}
```

### Exercise: Refactor

Extract a “makeService” function

This is very common in NixOS module code: same attrset structure repeated.

```nix
let
  web = {
    enable = true;
    name = "web";
    port = 8080;
    env = {
      LOG_LEVEL = "info";
      REGION = "us-west";
    };
  };

  worker = {
    enable = true;
    name = "worker";
    port = 9090;
    env = {
      LOG_LEVEL = "info";
      REGION = "us-west";
    };
  };
in
{
  services = [ web worker ];
}
```

Goal

Refactor so: - the repeated env block is defined once - the repeated “service shape” is built by a function - you can create a third service with minimal repetition

Constraints

- Keep the final output shape the same ({ services = [ ... ]; })
- Don’t remove fields; only refactor

##### Hint

Make a function like:

```nix
mkService = { name, port }: { ... };
```
