use tauri::{command, Window};
use tauri_plugin_oauth::start;

#[command]
pub async fn start_server(window: Window) -> Result<u16, String> {
    start(move |url| {
        // print start information
        println!("OAuth2 Server started at: {}", url);
        // Because of the unprotected localhost port, you must verify the URL here.
        // Preferebly send back only the token, or nothing at all if you can handle everything else in Rust.
        let _ = window.emit("redirect_uri", url);
    })
        .map_err(|err| err.to_string())
}