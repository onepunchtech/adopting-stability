---
title: Nix Language Primer
description: Introduction to the nix language
---

This primer introduces the **Nix expression language**. The goal is not to make you a Nix language expert, but to make the syntax and core ideas feel _predictable_ so later topics—flakes, packages, modules—don’t feel mysterious.

Nix is:

- **Pure** (no hidden side effects)
- **Lazy** (values are only evaluated when needed)
- **Expression-based** (everything returns a value)

There are no statements—only expressions.

# Why use an expression language?

## An Example Problem With Procedural Languages

```typescript
type Config = {
  port?: number;
  logging?: { level?: string; json?: boolean };
};

function applyBase(cfg: Config) {
  cfg.port = 8080;
  cfg.logging = { level: "info", json: false };
}

function applyProd(cfg: Config) {
  cfg.logging!.json = true;
  cfg.logging!.level = "warn";
}

const cfg: Config = {};
applyBase(cfg);
applyProd(cfg);

console.log(cfg);
```

- If you accidentally call applyProd before applyBase, you crash (cfg.logging!).
- If a third function mutates logging completely, you lose fields (“oops, json reset to false”).
- Deep merge semantics become “whatever the last function did”, not a predictable rule.
- The config is only correct after running all steps in the right order.

---

# Types and Primitives

Nix is dynamically typed, but it has a small, fixed set of core types.

## Basic types

```nix
123            # integer
3.14           # float
"hello"        # string
true / false   # booleans
null           # null value
```

Strings can be:

```nix
"hello ${name}"     # interpolated string
''                  # multiline string
  multi
  line
''
```

Interpolation only works in double-quoted or multiline strings.

---

## Paths

Paths are _not_ strings.

```nix
./file.txt
../other-dir
/nix/store/abcd...
```

This matters because paths are copied into the Nix store automatically when evaluated.

```nix
builtins.readFile ./config.txt
```

---

## attrsets (attribute sets)

Attrsets are **key–value maps**, similar to objects or dictionaries.

```nix
{
  name = "alice";
  age = 30;
}
```

Keys:

- Are identifiers (or quoted strings)
- Order does not matter

Accessing attributes:

```nix
person.name
```

Nested attrsets:

```nix
{
  user = {
    name = "alice";
    shell = "zsh";
  };
}
```

### Dynamic keys

```nix
let key = "answer"; in
{
  ${key} = 42;
}
```

---

## Lists

Lists are ordered collections.

```nix
[ 1 2 3 ]
[ "a" "b" "c" ]
```

Mixed types are allowed:

```nix
[ 1 "two" true ]
```

Indexing uses `builtins.elemAt`:

```nix
builtins.elemAt [ "a" "b" "c" ] 1
# => "b"
```

Common list operations (you’ll see these _everywhere_):

```nix
map (x: x * 2) [1 2 3]
filter (x: x > 2) [1 2 3 4]
```

---

## Let bindings

`let ... in ...` introduces local names.

```nix
let
  x = 2;
  y = 3;
in
x + y
```

- Everything after `in` can see the bindings
- Bindings are recursive (they can reference each other)

---

# Functions

Functions are **first-class values**.

## Function basics

```nix
x: x + 1
```

Calling a function:

```nix
(x: x + 1) 5
# => 6
```

Multiple arguments are written as **curried functions**:

```nix
x: y: x + y
```

Called as:

```nix
(x: y: x + y) 2 3
```

---

## Functions with attrsets (very important)

This is the most common pattern in Nix.

```nix
{ name, age }: "Hello ${name}, you are ${toString age}"
```

Calling it:

```nix
(fn { name = "alice"; age = 30; })
```

### Default values

```nix
{ name, age ? 42 }: age
```

### Catch-all arguments (`...`)

```nix
{ name, ... }: name
```

This allows extra attributes without error—used heavily in modules.

---

# Conditionals

`if` is an expression.

```nix
if x > 0 then "positive" else "negative"
```

Both branches must return the same _kind_ of value.

---

# Using the REPL

The Nix REPL is essential for learning and debugging.

```bash
nix repl
```

Inside the REPL:

```nix
1 + 2
```

Load a file:

```nix
:l ./example.nix
```

Print values:

```nix
:p myValue
```

Bring common helpers into scope (load flake):

```nix
:lf nixpkgs
```

The REPL is especially useful for:

- Exploring attrsets
- Checking function outputs
- Understanding error messages

---

# Working with Nix files

A `.nix` file evaluates to **a single expression**.

```nix
# example.nix
{ name }: "Hello ${name}"
```

Evaluate it:

```bash
nix eval --impure --expr '(import ./example.nix {name = "foo";})'
```

Importing other files:

```nix
let
  config = import ./config.nix;
in
config.value
```

Imports are **pure** and cached.

---

# Equality and operators

Equality:

```nix
1 == 1
1 != 2
```

Logical operators:

```nix
true && false
true || false
!true
```

String concatenation:

```nix
"hello " + "world"
```

List concatenation:

```nix
[1 2] ++ [3 4]
```

Attrset merge:

```nix
{ a = 1; } // { b = 2; }
```

Right side wins on conflicts.

---

# Laziness (why this matters)

Nix is lazy.

```nix
let
  x = throw "error";
in
1
```

This evaluates to `1` without error.

Why this matters:

- Infinite structures are possible
- Errors only happen when values are _used_
- Many configs define values that are never evaluated

---

# Builtins and the standard library

`builtins` is always in scope.

Common ones:

```nix
builtins.readFile
builtins.toString
builtins.map
builtins.attrNames
builtins.trace
```

Debugging:

```nix
builtins.trace "hello" value
```

---

# Patterns you’ll see later (preview)

These will make more sense now:

## Passing attrsets through layers

```nix
{ pkgs, lib, config, ... }:
```

## Overlays and overrides

```nix
self: super: {
  myPkg = super.myPkg;
}
```

```nix
self: super: {
  myPkg = super.myPkg.override {
    name = "myPkg-custom";
  };
}
```

## Flake outputs

```nix
outputs = { self, nixpkgs }: {
  packages.x86_64-linux.default = nixpkgs.legacyPackages.x86_64-linux.hello;
};
```

You don’t need to fully understand these yet—but the syntax should no longer look alien.

---

# Summary mental model

- Everything is an expression
- Attrsets are the backbone of configuration
- Functions frequently take attrsets
- Laziness is a feature, not a bug
- If the syntax looks weird, it’s usually because it’s **data, not control flow**
