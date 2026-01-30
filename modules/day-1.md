# Nix Workshop — Hands-On Lunch & Learn Series

> A practical, incremental introduction to Nix for engineers.  
> Each session is designed to fit into a 1-hour lunch-and-learn with live coding and discussion.

---

## Workshop Goals

- Reduce anxiety and confusion around Nix
- Build intuition through hands-on usage
- Enable engineers to contribute confidently
- Establish shared vocabulary and workflows
- Avoid unnecessary theory early

---

## Assumptions

- Participants have basic shell familiarity
- macOS or Linux laptops
- Internet access
- Willingness to experiment

---

---

# Day 1 — Why Nix Exists & Getting It Installed

## Objectives

- Understand the problems Nix is trying to solve
- Build a basic mental model of Nix
- Install Nix successfully
- Run a first Nix command

---

## Why Do We Need Something Like Nix?

### Discussion Prompt

How do you currently set up a new machine or project?

Capture:

- Package managers (brew, apt, yum)
- Language tools (pip, npm, cargo)
- Setup scripts
- Wiki docs
- Tribal knowledge

### Common Failure Modes

- "Works on my machine"
- Version drift
- Hidden dependencies
- Broken upgrades
- Slow onboarding
- Snowflake laptops
- CI mismatch

### Why Traditional Tools Struggle

- Mutable systems accumulate hidden state
- Order of operations matters
- Rollbacks are difficult
- Reproducing old environments is painful

---

## The Core Nix Idea

> Treat software environments as pure functions of inputs.

Key ideas:

- Immutable store
- Explicit dependencies
- Content-addressed paths
- Multiple versions can coexist safely
- Builds are isolated and reproducible

Visual model:
