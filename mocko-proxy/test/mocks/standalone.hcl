#-----------------------------
# status
#-----------------------------
mock "GET /default-status" { }
mock "PUT /default-status" { }
mock "DELETE /default-status" { }
mock "POST /default-status" { }
mock "GET /other-status" {
    status = 204
}
mock "* /wildcard-no-status" { }

#-----------------------------
# mock definition
#-----------------------------
mock "GET /headers" {
    headers {
        x-custom-header = "foo"
    }
}

mock "GET /body" {
    body = "Hello from Mocko :)"
}

mock "GET /delay" {
    delay = 200
}

#-----------------------------
# mock definition
#-----------------------------
mock "GET /vhost" {
    body = "global"
}

mock "GET /vhost" {
    host = "mocko.dev"
    body = "vhost"
}

mock "GET /vhost-only" {
    host = "mocko.dev"
    body = "vhost"
}
