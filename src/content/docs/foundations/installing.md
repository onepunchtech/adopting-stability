---
title: Installing nix
description: Guide for installing nix.
---

## Linux

Install Nix (multi-user, recommended)

```

curl -L https://nixos.org/nix/install | sh -s -- --daemon

```

Follow the prompts. When it finishes, restart your shell or source the environment:

```
. /etc/profile.d/nix.sh
```

Enable flakes (if not already enabled)

```
mkdir -p ~/.config/nix
cat <<EOF >> ~/.config/nix/nix.conf
experimental-features = nix-command flakes
EOF
```

Validate the Install

```
nix --version
```

Then:

```
nix shell nixpkgs#hello -c hello
```

Expected output:

```
Hello, world!
```

If you see that, Nix is working.

## macOS

Install Nix (multi-user, recommended)

```
curl -L https://nixos.org/nix/install | sh -s -- --daemon
```

You’ll be prompted for your password to set up the daemon and launchd services.

Restart your terminal afterward.

```
Enable flakes
mkdir -p ~/.config/nix
cat <<EOF >> ~/.config/nix/nix.conf
experimental-features = nix-command flakes
EOF

```

Validate the Install

```
nix --version
```

Then:

```
nix shell nixpkgs#hello -c hello
```

You should see:

```
Hello, world!
```

## WSL (Ubuntu / Debian-based)

Edit /etc/wsl.conf:

```
[boot]
systemd=true
```

Then restart WSL from Windows:

```
wsl --shutdown

```

Reopen your WSL terminal.

```
Install Nix
curl -L https://nixos.org/nix/install | sh -s -- --daemon
```

Then load the environment:

```
. /etc/profile.d/nix.sh
```

Enable flakes

```
mkdir -p ~/.config/nix
cat <<EOF >> ~/.config/nix/nix.conf
experimental-features = nix-command flakes
EOF
```

Validate the Install

```
nix --version
```

Then:

```
nix shell nixpkgs#hello -c hello
```

Expected output:

```
Hello, world!
```
