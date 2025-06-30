
use axum::{
    routing::{get, post, delete},
    http::{Method, StatusCode},
    Router,
    response::{Json, IntoResponse},
    extract::{State, Query, Path},
};
use std::sync::{Arc, Mutex};
use rusqlite::Connection;
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use tower_http::cors::{CorsLayer, Any};
use url::Url;

#[derive(Serialize, Deserialize, Debug)]
struct LogEntry {
    id: i32,
    url: String,
    title: String,
    timestamp: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct MonitoredSite {
    id: i32,
    domain: String,
}

type DbState = Arc<Mutex<Connection>>;

#[tokio::main]
async fn main() {
    // データベース接続の初期化
    let conn = Connection::open("history.db").expect("Failed to open database");
    init_db(&conn).expect("Failed to initialize database");
    let db_state = Arc::new(Mutex::new(conn));

    // CORS設定
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::DELETE])
        .allow_origin(Any)
        .allow_headers(vec![axum::http::header::CONTENT_TYPE]);

    // ルーターの設定
    let app = Router::new()
        .route("/api/history", get(get_history))
        .route("/api/log", post(log_entry))
        .route("/api/is_monitored", get(is_monitored))
        .route("/api/sites", get(get_sites).post(add_site)) // New endpoints for sites
        .route("/api/sites/:id", delete(delete_site))      // New endpoint for deleting a site
        .with_state(db_state)
        .layer(cors);

    // サーバーの起動
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    println!("Listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

fn init_db(conn: &Connection) -> rusqlite::Result<()> {
    // history table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY,
            url TEXT NOT NULL,
            title TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )",
        [],
    )?;

    // monitored_sites table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS monitored_sites (
            id INTEGER PRIMARY KEY,
            domain TEXT NOT NULL UNIQUE
        )",
        [],
    )?;

    // Insert some default sites for testing (ignores if already exists)
    conn.execute("INSERT OR IGNORE INTO monitored_sites (domain) VALUES (?)", ["shonenjumpplus.com"])?;
    conn.execute("INSERT OR IGNORE INTO monitored_sites (domain) VALUES (?)", ["tonarinoyj.jp"])?;
    conn.execute("INSERT OR IGNORE INTO monitored_sites (domain) VALUES (?)", ["comic-days.com"])?;

    Ok(())
}

// --- Site Management Handlers ---

async fn get_sites(State(db): State<DbState>) -> Json<Vec<MonitoredSite>> {
    let conn = db.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, domain FROM monitored_sites ORDER BY domain").unwrap();
    let sites_iter = stmt.query_map([], |row| {
        Ok(MonitoredSite {
            id: row.get(0)?,
            domain: row.get(1)?,
        })
    }).unwrap();

    let mut sites = Vec::new();
    for site in sites_iter {
        sites.push(site.unwrap());
    }
    Json(sites)
}

#[derive(Deserialize)]
struct AddSiteRequest {
    domain: String,
}

async fn add_site(State(db): State<DbState>, Json(payload): Json<AddSiteRequest>) -> impl IntoResponse {
    let conn = db.lock().unwrap();
    match conn.execute("INSERT INTO monitored_sites (domain) VALUES (?)", [&payload.domain]) {
        Ok(_) => (StatusCode::CREATED, "Site added successfully".to_string()),
        Err(e) => (StatusCode::BAD_REQUEST, format!("Failed to add site: {}", e)),
    }
}

async fn delete_site(State(db): State<DbState>, Path(id): Path<i32>) -> impl IntoResponse {
    let conn = db.lock().unwrap();
    match conn.execute("DELETE FROM monitored_sites WHERE id = ?", [id]) {
        Ok(rows_affected) if rows_affected > 0 => (StatusCode::OK, "Site deleted successfully".to_string()),
        Ok(_) => (StatusCode::NOT_FOUND, "Site not found".to_string()),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete site: {}", e)),
    }
}


// --- Existing Handlers ---

#[derive(Deserialize)]
struct IsMonitoredQuery {
    url: String,
}

#[derive(Serialize)]
struct IsMonitoredResponse {
    is_monitored: bool,
}

async fn is_monitored(State(db): State<DbState>, Query(query): Query<IsMonitoredQuery>) -> Result<Json<IsMonitoredResponse>, StatusCode> {
    let conn = db.lock().unwrap();

    let parsed_url = match Url::parse(&query.url) {
        Ok(url) => url,
        Err(_) => return Ok(Json(IsMonitoredResponse { is_monitored: false })),
    };

    let query_domain = match parsed_url.domain() {
        Some(domain) => domain.to_lowercase(),
        None => return Ok(Json(IsMonitoredResponse { is_monitored: false })),
    };
    
    println!("[Debug] Checking domain: {}", query_domain);

    let mut stmt = conn.prepare("SELECT domain FROM monitored_sites").unwrap();
    let monitored_domains = stmt.query_map([], |row| row.get::<_, String>(0)).unwrap();

    for domain_result in monitored_domains {
        if let Ok(monitored_domain) = domain_result {
            println!("[Debug]  -> Comparing with: {}", monitored_domain);
            if query_domain == monitored_domain || query_domain.ends_with(&format!(".{}", monitored_domain)) {
                println!("[Debug]  --> Match found!");
                return Ok(Json(IsMonitoredResponse { is_monitored: true }));
            }
        }
    }
    
    println!("[Debug]  -> No match found.");
    Ok(Json(IsMonitoredResponse { is_monitored: false }))
}


async fn get_history(State(db): State<DbState>) -> Json<Vec<LogEntry>> {
    let conn = db.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, url, title, timestamp FROM history ORDER BY timestamp DESC").unwrap();
    let history_iter = stmt.query_map([], |row| {
        let timestamp_str: String = row.get(3)?;
        Ok(LogEntry {
            id: row.get(0)?,
            url: row.get(1)?,
            title: row.get(2)?,
            timestamp: timestamp_str.parse().unwrap_or_else(|_| Utc::now()),
        })
    }).unwrap();

    let mut history = Vec::new();
    for entry in history_iter {
        history.push(entry.unwrap());
    }
    Json(history)
}

#[derive(Deserialize)]
struct LogRequest {
    url: String,
    title: String,
}

async fn log_entry(State(db): State<DbState>, Json(payload): Json<LogRequest>) {
    let conn = db.lock().unwrap();
    conn.execute(
        "INSERT INTO history (url, title, timestamp) VALUES (?1, ?2, ?3)",
        &[&payload.url, &payload.title, &Utc::now().to_rfc3339()],
    ).unwrap();
    println!("Logged: url={}, title={}", payload.url, payload.title);
}
