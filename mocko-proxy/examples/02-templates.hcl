# Mocking cat resources
mock "GET /cats/{name}" {
  # For templating the status, you can set it to a string and use handlerbars with handlerbars-helpers functions
  status = <<-EOF
  {{#startsWith 'g' (downcase request.params.name) }}
    200
  {{else}}
    404
  {{/startsWith}}
  EOF

  headers {
    Content-Type    = "application/json"
  }

  # Response body accepts handlebars syntax with handlebars-helpers functions, available fields are:
  # request: { params, headers, query, body }
  body = <<-EOF
  {{#startsWith 'g' (downcase request.params.name) }}
    {
      "id": 1,
      "name": "{{capitalizeAll request.params.name }}"
    }
  {{else}}
    {
      "error": "Not found error",
      "message": "Cat not found"
    }
  {{/startsWith}}
  EOF
}
