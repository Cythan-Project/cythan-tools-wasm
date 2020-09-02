use wasm_bindgen::prelude::*;

const ITERATIONS: usize = 1_000;

#[wasm_bindgen]
pub fn compile_to_cythan(cythan_code: String) -> String {
    match _compile_to_cythan(&cythan_code) {
        Ok(e) => {
            let out = e
                .iter()
                .map(u32::to_string)
                .collect::<Vec<String>>()
                .join(" ");

            match try_compute(&e) {
                Ok(n) => format!(
                    "{}\r\n\r\nComputed to:\r\n\r\n{}",
                    out,
                    n.iter()
                        .map(usize::to_string)
                        .collect::<Vec<String>>()
                        .join(" ")
                ),
                Err(n) => format!(
                    "{}\r\n\nDon't stopped after {} iterations:\n\r\n{}",
                    out,
                    ITERATIONS,
                    n.iter()
                        .map(usize::to_string)
                        .collect::<Vec<String>>()
                        .join(" ")
                ),
            }
        }
        Err(e) => e,
    }
}

pub fn try_compute(code: &[u32]) -> Result<Vec<usize>, Vec<usize>> {
    use cythan::{BasicCythan, Cythan};

    let mut cy = BasicCythan::new(code.iter().map(|x| *x as usize).collect());

    for _ in 0..ITERATIONS {
        cy.next();
    }

    let o = cy.cases.clone();

    cy.next();

    if o == cy.cases {
        Ok(cy.cases)
    } else {
        cy.next();
        if o == cy.cases {
            cy.next();
            if o == cy.cases {
                Ok(cy.cases)
            } else {
                Err(o)
            }
        } else {
            Err(o)
        }
    }
}

#[wasm_bindgen]
pub fn format_code(cythan_code: String) -> String {
    match _format_code(&cythan_code) {
        Ok(e) => e,
        Err(e) => e,
    }
}

fn _compile_to_cythan(cythan_code: &str) -> Result<Vec<u32>, String> {
    Ok(cythan_compiler::Context::default()
        .compute(&cythan_compiler::generate_tokens(cythan_code).map_err(|x| x.to_string())?)
        .map_err(|x| x.to_string())?)
}

fn _format_code(cythan_code: &str) -> Result<String, String> {
    Ok(cythan_compiler::generate_tokens(cythan_code)
        .map_err(|x| x.to_string())?
        .iter()
        .map(|x| x.to_string())
        .flatten()
        .fold(String::new(), |a, b| a + "\r\n" + &b))
}

// (This function is invoked by `init` function in `index.html`.)
#[wasm_bindgen(start)]
pub fn start() {}
