mock "GET /hello" {
    body = "{{proxy 'http://localhost:6625/'}}"
}

mock "POST /validate/{any}" {
    body = "{{proxy 'http://localhost:6625/'}}"
}

// Testing multiple hosts
host "v1" {
    source      = "v1.local"
    destination = "http://localhost:6625/v1"
}
host "v2" {
    source      = "v2.local"
    destination = "http://localhost:6625/v2"
}

mock "GET /host-one" {
    body = "{{proxy 'v1'}}"
}
mock "GET /host-two" {
    body = "{{proxy 'v2'}}"
}
mock "GET /host-generic" {
    body = "{{proxy}}"
}
