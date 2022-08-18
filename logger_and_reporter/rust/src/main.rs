use actix_web::{get, post, HttpResponse, web, App, HttpServer, Responder};
//use std::path::Path;
//use actix_files::Files;

#[get("/storage")]
async fn storage_req(name: web::Path<String>) -> impl Responder {
    format!("Storage")
}

// daemon notifies logger about successful execution using sec_key auth
// /notify_logger?sec_keyX=&id=Y&result=N
// https://docs.rs/sube/latest/sube/
#[post("notify_logger")]
async fn extrs(req_body: String) -> impl Responder {
//    let CHAIN_URL = String::from("127.0.0.1:9999");
//    let client: Sube<_> = ws::Backend::new_ws2(CHAIN_URL).await?.into();
//    client.submit(SIGNED_EXTRINSIC).await?;
    HttpResponse::Ok().body("ok")
}


#[actix_web::main] // or #[tokio::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/storage", web::get().to(|| async { "Astorage" }))
            .route("/notify_logger", web::post())
            .service(storage_req)
    })
    .bind(("127.0.0.1", 9999))?
    .run()
    .await
}
