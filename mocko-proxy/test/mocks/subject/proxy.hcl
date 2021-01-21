mock "GET /hello" {
    body = "{{proxy 'http://localhost:6625/'}}"
}

mock "POST /validate/{any}" {
    body = "{{proxy 'http://localhost:6625/'}}"
}
