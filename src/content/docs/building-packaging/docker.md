---
title: Building Software with Nix
description: Derivations, fetchers, helpers, overlays, and real-world packaging patterns
---

# Minimal Docker Images: Nix vs Dockerfile

This section builds the _same_ tiny program two ways:

1. **Dockerfile** using a regular base image (still includes a whole distro)
2. **Nix** using `dockerTools.buildLayeredImage` (image contains only what you ask for)

We’ll then compare **image size** and **layers** using standard Docker inspection commands.

---

## The example program

Create `src/hello.c`:

```c
#include <stdio.h>

int main(int argc, char *argv[]) {
  const char *name = (argc > 1) ? argv[1] : "world";
  printf("hello, %s!\n", name);
  return 0;
}
```

---

## Build a minimal Docker image with Nix

### `flake.nix` (relevant excerpt)

This builds a **static** C binary and puts only that binary into the image.

```nix

  # Build a static binary so the image doesn't need glibc, etc.
  hello-static = pkgs.pkgsStatic.stdenv.mkDerivation {
    pname = "hello-static";
    version = "1.0";
    src = ./src;

    buildPhase = ''
      gcc hello.c -O2 -static -o hello
    '';

    installPhase = ''
      mkdir -p $out/bin
      install -m755 hello $out/bin/hello
    '';
  };

  hello-nix-image = pkgs.dockerTools.buildLayeredImage {
    name = "hello-nix";
    tag = "latest";

    # Only include our binary.
    contents = [ hello-static ];

    config = {
      Cmd = [ "/bin/hello" ];
    };
  };
```

### Build + load the image

```bash
nix build -L .#hello-nix-image
docker load < result
```

Run it:

```bash
docker run --rm hello-nix:latest ChatGPT
```

---

## Build a comparable Docker image with Dockerfile

A “normal” Docker build typically starts from a base image (e.g. Alpine, Debian, Ubuntu).
Even “minimal” base images still include lots of filesystem + package manager bits.

### `Dockerfile`

```dockerfile
# Build stage
FROM alpine:3.19 AS build
RUN apk add --no-cache build-base
WORKDIR /src
COPY src/hello.c .
RUN cc hello.c -O2 -static -o hello

# Runtime stage
FROM alpine:3.19
COPY --from=build /src/hello /bin/hello
ENTRYPOINT ["/bin/hello"]
```

Build + run:

```bash
docker build -t hello-docker:latest .
docker run --rm hello-docker:latest ChatGPT
```

---

## Compare size

### Quick size overview

```bash
docker image ls | rg 'hello-nix|hello-docker'
```

(If you don’t have `rg`, use `grep`.)

### Disk usage summary

```bash
docker system df
```

### Nix output size (store size)

This shows how big the Nix-produced image artifact is in the store:

```bash
nix path-info -Sh .#hello-nix-image
```

---

## Inspect layers and why “base images” add bloat

### Show layer history (size per layer)

```bash
docker history hello-docker:latest
docker history hello-nix:latest
```

What to look for:

- The Dockerfile version will include a layer for the base image filesystem
- The Nix version should be tiny: mostly just your binary (and maybe metadata)

### Inspect image metadata (Entrypoint/Cmd, etc.)

```bash
docker inspect hello-docker:latest --format '{{json .Config}}' | jq
docker inspect hello-nix:latest --format '{{json .Config}}' | jq
```

### Explore the filesystem contents quickly

Run a shell inside each image and list what’s there:

```bash
docker run --rm -it --entrypoint sh hello-docker:latest -lc 'ls -lah /; ls -lah /bin | head'
```

The Nix image won’t have `sh` (because we didn’t include it). That’s the point:
it contains only what you asked for.

If you want an interactive shell in the Nix image for inspection, add it explicitly:

```nix
contents = [ hello-static pkgs.busybox ];
config = { Cmd = [ "/bin/hello" ]; };
```

Then rebuild and you can:

```bash
docker run --rm -it --entrypoint sh hello-nix:latest -lc 'ls -lah /; ls -lah /bin'
```

---

## Optional: Deep layer inspection tools

If you have them installed:

### `dive` (interactive layer explorer)

```bash
dive hello-docker:latest
dive hello-nix:latest
```

### `skopeo` (inspect without running)

```bash
skopeo inspect docker-daemon:hello-docker:latest | jq '.Size, .Layers'
skopeo inspect docker-daemon:hello-nix:latest | jq '.Size, .Layers'
```
