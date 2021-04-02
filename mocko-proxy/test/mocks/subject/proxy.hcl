mock "GET /hello" {
    body = "{{proxy 'http://localhost:6625/'}}"
}

mock "POST /validate/{any}" {
    body = "{{proxy 'http://localhost:6625/'}}"
}

host "content" {
    source      = "content.local"
    destination = "http://localhost:6625"
}

mock "GET /proxy-to-host" {
    body = "{{proxy 'content'}}"
}
