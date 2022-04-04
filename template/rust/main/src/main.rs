//#![deny(warnings)]

use std::collections::HashMap;

use std::net::Ipv4Addr;

use std::sync::Arc;
use std::sync::atomic::{AtomicPtr, Ordering};

use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Error, Response, Server};

use json::JsonValue;

#[tokio::main]
async fn main() {
    let address = std::env::var("HOST")
        .unwrap_or_else(|_| "127.0.0.1".to_string())
        .parse::<Ipv4Addr>().unwrap();
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .unwrap();

    let addr = (address, port).into();

    // Theses variables are the state of the server.
    let widgets = Arc::new(AtomicPtr::new(0 as *mut HashMap<String, JsonValue>));
    let listeners = Arc::new(AtomicPtr::new(0 as *mut HashMap<String, JsonValue>));
    let entrypoint = Arc::new(AtomicPtr::new(0 as *mut String));

    // The closure inside `make_service_fn` is run for each connection,
    // creating a 'service' to handle requests for that specific connection.
    let make_service = make_service_fn(move |_| {
        // While the state was moved into the make_service closure,
        // we need to clone it here because this closure is called
        // once for every connection.
        //
        // Each connection could send multiple requests, so
        // the `Service` needs a clone to handle later requests.
        let widgets = Arc::clone(&widgets);
        let listeners = Arc::clone(&listeners);
        let entrypoint = Arc::clone(&entrypoint);

        async move {
            // This is the `Service` that will handle the connection.
            // `service_fn` is a helper to convert a function that
            // returns a Response into a `Service`.
            Ok::<_, Error>(service_fn(move |_req| {
                // Get the current count, and also increment by 1, in a single
                // atomic operation.
                let mut entrypoint = unsafe { &mut *entrypoint.load(Ordering::Relaxed) };

                async move { Ok::<_, Error>(Response::new(Body::from(format!("Request #{}", entrypoint)))) }
            }))
        }
    });

    let server = Server::bind(&addr).serve(make_service);

    println!("Listening on http://{}", addr);

    if let Err(e) = server.await {
        eprintln!("server error: {}", e);
    }
}
