mock "GET /cats/{name}" {
    status = 404

    headers {
        Content-Type = "application/json"
    }

    body = <<-EOF
    {
        "error": "Not found error",
        "message": "Cat not found"
    }
    EOF
}

mock "GET /cats/george" {
    headers {
        Content-Type = "application/json"
    }

    body = <<-EOF
    {
        "id": 1,
        "name": "George"
    }
    EOF
}

mock "GET /no-status" { }
mock "PUT /no-status" { }
mock "POST /no-status" { }
mock "DELETE /no-status" { }
mock "* /wildcard-no-status" { }

mock "GET /header" {
    headers {
        foo = "bar"
    }
}

mock "GET /delay" {
    delay = 500
}

mock "GET /hello" {
    body = "hello from mocko-content"
}
