// ============================================================
// MYTHWRIGHT — TAURI BACKEND
// Minimal Rust backend. All app logic lives in the React/TS
// frontend. This file wires native OS features as needed:
//   • File system access for local exports
//   • Shell for opening URLs in the default browser
// ============================================================
use tauri::Manager;

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Open a URL in the system default browser.
/// Called from the frontend for external links and export previews.
#[tauri::command]
async fn open_url(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_app_version, open_url])
        .run(tauri::generate_context!())
        .expect("error while running Mythwright");
}
