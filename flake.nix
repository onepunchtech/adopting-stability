{
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    inputs:
    inputs.flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = (import (inputs.nixpkgs) { inherit system; });
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            yarn
            nodePackages.pnpm
            nodePackages.typescript
            nodePackages.typescript-language-server
          ];

          shellHook = ''
            export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

            # Put Corepack shims in a writable place (NOT /nix/store)
            mkdir -p "$HOME/.local/bin"
            export PATH="$HOME/.local/bin:$PATH"

            corepack enable --install-directory "$HOME/.local/bin"

            echo "Node: $(node -v)"
            echo "Yarn: $(yarn --version)"
          '';
        };
      }
    );
}
