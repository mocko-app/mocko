# Mocking a 404 for GET on /cats/*
mock "GET /cats/{name}" {
  # This is how you set response status, defaults to 201 for POST and 200 for other methods
  status = 404

  # Headers are defined in a map, don't forget your content type
  headers {
    Content-Type    = "application/json"
    X-Custom-Header = "cat-not-found"
  }

  # Response body is a string and can be defined in a multi-line string
  body = <<-EOF
  {
    "error": "Not found error",
    "message": "Cat not found"
  }
  EOF
}

# Mocking George, the cat
mock "GET /cats/george" {
  status = 200

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
