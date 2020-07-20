# Mocking empty posts for user with id 1
# GET /posts?userId=1 will be mocked
# GET /posts?userId=2 (and others) will be proxied to the real API
mock "GET /posts" {
  headers {
    Content-Type = "application/json"
  }

  body = <<-EOF
    {{! If the query "userId" is 1, return an empty array, otherwise proxy to the real API }}
    {{#is request.query.userId 1}}
      []
    {{else}}
      {{proxy}}
    {{/is}}
  EOF
}
