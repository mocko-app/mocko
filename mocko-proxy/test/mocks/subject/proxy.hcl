mock "GET /hello" {
    body = "{{proxy 'http://localhost:6625/'}}"
}
