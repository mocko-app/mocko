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

mock "GET /json/no-header" {
    body = <<EOF
        {"foo":"bar","nested":{"baz":1}
        }
    EOF
}

mock "GET /json/with-header" {
    headers {
        Content-Type = "application/json+hal"
    }
    body = "{\"foo\":\"bar\"}"
}

mock "GET /json/text" {
    headers {
        Content-Type = "text/plain"
    }
    body = "{\"foo\":\"bar\"}"
}

mock "GET /json/dynamic-header" {
    body = <<EOF
        {{setHeader 'Content-Type' 'application/json+hal'}}
        {"foo":"bar"}
    EOF
}

mock "GET /json/override-text" {
    headers {
        content-type = "application/json"
    }
    body = "{{setHeader 'Content-Type' 'text/plain'}}{\"foo\":\"bar\"}"
}

mock "GET /json/invalid-no-header" {
    body = "{not-json"
}

mock "GET /json/invalid-with-header" {
    headers {
        Content-Type = "application/json+hal"
    }
    body = "{not-json"
}

mock "GET /json/invalid-dynamic-header" {
    body = "{{setHeader 'Content-Type' 'application/json+hal'}}{not-json"
}

mock "GET /json/empty-no-header" {
    body = ""
}

mock "GET /json/whitespace-no-header" {
    body = <<EOF
        
    EOF
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
