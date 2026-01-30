# Day 0

## Why nix

###

If we pin pom.xml, are we guaranteed the same build a year from now?

###

If we can’t guarantee reproducible builds today, how much time do we spend compensating for that without realizing it?

### Broken window fallacy

####

### Nix isn't pain free

#### Language

- Non-mainstream syntax
- Laziness surprises
- Poor error messages
- Reading is easier than writing
- Debugging can feel indirect

#### Purity & Friction

- “Why can’t I just curl this thing?”
- “Why is this forbidden?”
- “Why do I need to declare this explicitly?”

#### Learning Curve

- Steep initial slope
- Feels slower before it feels faster
- Easy to feel blocked early on

#### Documentation and tooling

- documentation -> Could be better
- ide support -> Could be better

#### Why these warts exist

| Frustration      | What It Enforces           |
| ---------------- | -------------------------- |
| No implicit deps | Explicit dependency graphs |
| No global state  | Reproducibility            |
| No network       | Hermetic builds            |
| Immutable store  | Rollbacks & safety         |
| Weird language   | Laziness + composability   |

#### Nix makes you pay the cost upfront

Nix charges you early for mistakes you normally pay for later.
| | |
|--|--|
| Missing dependency | caught at build time, not prod |
| Undeclared tool | caught immediately, not on a coworker’s laptop |
| Drift | impossible, not “unlikely” |
| extensibility | add/change functionality without touching old code |

#### The Honest Promise

Nix will not make everything faster.
It will not remove all pain.
It will not feel good every day.

---

What it does do is make problems repeatable, inspectable, and fixable once.

## High level overview of nix

## Comparing to other solutions

- Surely something else exists that is comparable. Right?

### Docker

#### How Docker Builds Really Work

- Docker Builds Are Filesystem-Based, Not Dependency-Based

- Docker images are built as a stack of filesystem layers

- Each instruction in a Dockerfile (RUN, COPY, ADD, etc.) creates a new layer

Layers record:

- file additions
- file deletions
- file modifications

Docker does not understand:

- why a file exists
- which files are dependencies vs outputs
- which tools were actually used

#### What Docker Does Well

- Produces a runnable, isolated filesystem snapshot
- Ensures runtime parity between machines
- Freezes results, not process

#### What Docker Cannot Guarantee

- Deterministic builds over time
- Reproducible images from the same Dockerfile
- Explicit dependency graphs
- Hermetic builds

#### Implications

- Docker tracks what changed on disk, not what the build depends on.
- Docker isolates well, but doesn't integrate well
- half tools on local machine, half the tools inside docker images

### Others

The industry keeps independently rediscovering the same problems — and inventing partial solutions inside narrower scopes.

Nix didn’t invent these concerns. It’s the first tool that tries to solve them generally, instead of per-language or per-runtime.

asdf / mise – great for tools, not system deps, no purity
devcontainers – good UX, still Docker-centric, heavy
bazel / pants – excellent builds, weak local dev ergonomics
ansible / chef / salt – fleet config, poor dev loop
homebrew + scripts – works… until it doesn’t

### Case studies

#### Yarn

What Yarn Was Trying to Fix

Non-deterministic installs (package.json alone was not enough)

“Works on my machine” caused by solver drift

Hidden transitive dependency changes

Slow, stateful installs

How Yarn Addressed It

Lockfiles (yarn.lock) → explicit dependency graphs

Deterministic resolution → same tree everywhere

Content-addressed cache → reuse instead of rebuild

Offline installs → fewer hidden dependencies

Why This Matters

Yarn is an admission that imperative package installs are not reliable

The industry accepted:

reproducibility matters

dependency graphs must be explicit

Where Yarn Falls Short (By Design)

Only governs JavaScript dependencies

Assumes the system environment already works

Cannot model:

compilers

native libraries

OS differences

build tools

Connection to Nix

Yarn makes JavaScript reproducible inside an unreproducible system.
Nix applies the same ideas to the entire system.

#### SBT

sbt wasn’t meant to be “just Scala’s Maven.”

Its original ambitions:
Incremental builds
Precise dependency tracking
Declarative build definitions
Programmatic builds (builds as code)
Cross-project composition
Sound familiar again?

sbt introduced:

Fine-grained incremental compilation
Task graphs
Dependency-aware caching
Build definitions as Scala code
These ideas later influenced:
Bazel
Pants
Buck
Gradle

Here’s the important part — not because it was “bad”, but because of constraints.

1. Host Environment Leakage

sbt assumes:

JVM already exists

OS dependencies are present

Toolchains are correct

Build correctness still depends on ambient state.

2. Non-Hermetic Builds

Tasks can run arbitrary code

Network access is implicit

Builds can depend on time, filesystem, environment variables

This makes builds powerful — and non-reproducible.

3. Scope Explosion

Because sbt is:

Embedded in Scala

Highly flexible

Turing-complete

…it became:

Hard to reason about

Hard to standardize

Hard to cache globally

You can say:

sbt gives you power, but not constraints.

That’s the opposite tradeoff of Nix.

#### Haskell

Haskell learned to treat dependency updates like a pipeline, not a fire drill

Haskell teams historically had a hard versioning problem:
Lots of small libraries
Deep dependency trees
Frequent upstream changes
Builds breaking due to solver drift / native deps
What emerged (in practice) is a pattern that looks very Nix-like:
Pin a complete package universe (compiler + libraries + native deps).
Make updates mechanical (not artisanal).
Build everything automatically to see what breaks.
Treat breakage as data (a matrix), not a surprise.
Promote only the green set into the “blessed” environment.

### Landing on nix

The problem I care about is not novelty or elegance.
It’s this:
a simple, reproducible developer environment that integrates cleanly with how we build and ship production systems.

I’ve spent years trying different approaches — containers, scripts, config management, language tools — and they all work to some degree.

Given the constraints of:

- reproducibility
- composability
- local developer ergonomics
- production integration
- long-term maintenance

  Nix is the only tool I’ve found that makes the full set of tradeoffs explicit and survivable.

## What Success Looks Like

You Will Be Able To

- Explain what problem Nix is solving — and why we’re using it
- Read basic Nix expressions:
- derivations vs modules

Use Nix to

- enter reproducible dev environments
- build and run real software
- Read and modify simple NixOS modules:

The Frustration Will Feel Different

- Strictness → guardrails
- Errors → signals
- Rebuilds → evidence

## What is nix

### What is nix?

Nix Is a Toolchain for Reproducible Systems

Nix is:

a package manager

a build system

a configuration language

But more importantly:

Nix is a way to make builds and environments predictable

#### The Problem Nix Focuses On

Given the same inputs, we want the same result — every time.

That includes:

source code

dependencies

compilers

build tools

system libraries

Most tools only control some of these.
Nix tries to control all of them.

Core Idea

Instead of mutating a system step by step,
Nix describes what the system should be, and builds it from explicit inputs.

This is what enables reproducibility.

### How Nix Works: Store + Derivations

The Nix Store

All build outputs live in a single place:

/nix/store

Each output path includes a hash

The hash is derived from:

inputs

dependencies

build instructions

Example shape:

/nix/store/<hash>-openssl-3.0.12

Why This Matters

Multiple versions can exist at the same time

Nothing is overwritten

No accidental upgrades

Rollbacks are trivial

If the inputs change, the path changes.
If the path didn’t change, the inputs didn’t either.

Key Property

The filesystem path is a proof of how something was built.

### Derivations: Builds as Explicit Functions

What Is a Derivation?

A derivation is Nix’s description of:

what to build

from which inputs

using which tools

producing which outputs

Conceptually:

inputs → derivation → /nix/store result

Important Properties

Inputs are explicit

Builds are isolated

Network access is disabled by default

Hidden dependencies are not allowed

This means:

Builds either succeed for the right reasons

Or fail early and predictably

How This Solves Reproducible Builds

Same derivation + same inputs → same output

Different inputs → different output (by construction)

No reliance on ambient system state

Nix doesn’t try to remember what happened.
It remembers why something was built.

### Why a Restricted Expression Language Is Part of the Solution

The Problem With “Just Use a Script”

Shell scripts and general-purpose languages:

Can read arbitrary files

Can access the network

Can depend on time, environment, and global state

That power makes builds:

hard to reason about

hard to reproduce

hard to cache correctly

If anything can influence the build, everything must be assumed to.

What Nix’s Language Restricts (On Purpose)

No implicit I/O during evaluation

No hidden access to the filesystem

No network access

No ambient state

This means:

Evaluation is pure

Dependencies must be declared explicitly

The build graph can be analyzed before anything runs

Why This Matters for Reproducibility

Nix can know exactly what a build depends on

Caching is correct, not heuristic

Builds can be repeated with confidence

The language isn’t restrictive to limit you —
it’s restrictive so the system can trust the result.

Key Insight

A less powerful language makes a more powerful build system.

The restriction is what allows Nix to:

reason globally

compose builds safely

enforce reproducibility
