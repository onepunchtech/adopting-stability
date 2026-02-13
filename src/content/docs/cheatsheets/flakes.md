---
title: Flakes Cheatsheet
description: Common commands and references for working with Nix flakes
---

## Initialize a Flake

Create a new directory, or `cd` into an existing project directory that you want to convert into a flake.

Initialize using a template:

```bash
nix flake init -t github:akirak/flake-templates#flake-utils
```

You can also initialize with the default template:

```bash
nix flake init
```

---

## List Available Flake Templates

List templates from the built-in registry:

```bash
nix flake show templates
```

You can also inspect templates from any flake:

```bash
nix flake show github:akirak/flake-templates
```

---

## Inspect a Flake's Outputs

To see what a flake provides (packages, devShells, apps, etc.):

```bash
nix flake show
```

To inspect a specific flake:

```bash
nix flake show github:NixOS/nixpkgs
```

---

## Flake Input URL Syntax Reference

Flake inputs support several URL-like syntaxes (GitHub, Git, local paths, tarballs, etc.).

Official reference:

[https://nix.dev/manual/nix/2.18/command-ref/new-cli/nix3-flake#url-like-syntax](https://nix.dev/manual/nix/2.18/command-ref/new-cli/nix3-flake#url-like-syntax)
