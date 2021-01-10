# Mocking a 404 for GET on /cats/*
mock "GET /cats/{name}" {
  status = 404

  headers {
    Content-Type    = "application/json"
  }

  body = <<EOF
  {
    "error": "Not found error",
    "message": "Cat {{ request.params.name }} not found"
  }
  EOF
}

# Mocking George, the cat
mock "GET /cats/george" {
  headers {
    Content-Type = "application/json"
  }

  body = <<EOF
  {
    "id": 1,
    "name": "George"
  }
  EOF
}
