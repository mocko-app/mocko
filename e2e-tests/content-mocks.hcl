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
