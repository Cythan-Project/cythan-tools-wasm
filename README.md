# cythan-tools-wasm
 A set of tools that can be used from JS to execute cythan
 See a online demo on [https://ccgauche.github.io/cythan/](https://ccgauche.github.io/cythan/)

## Build from source

[Install Rust.](https://www.rust-lang.org/tools/install)

Install Cargo Make:
```
cargo install cargo-make
```

Build the project:
```
cargo make build_release
```

Open Webserver on `localhost:80`:
```
cargo make serve
```