# Simulating instability and latency on GET /users
mock "GET /users" {
  # Adding a second of delay to requests (mocked or proxied)
  delay = 1000
  headers {
    Content-Type = "application/json"
  }

  body = <<-EOF
    {{! With a 30% change, return a 500 error, otherwise proxy to the real API }}
    {{#lt (random 0 100) 30}}
      {{setStatus 500}}
      {
        "message": "Internal server error"
      }
    {{else}}
      {{proxy}}
    {{/lt}}
  EOF
}
