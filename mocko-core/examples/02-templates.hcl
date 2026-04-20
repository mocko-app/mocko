# Mocking cat resources
mock "GET /cats/{name}" {
  status = 200

  headers {
    Content-Type = "application/json"
  }

  # Response body accepts handlebars syntax with handlebars-helpers functions, available fields are:
  # request: { params, headers, query, body }
  # For documentation check:
  # https://handlebarsjs.com/guide/#nested-input-objects
  # https://github.com/helpers/handlebars-helpers
  body = <<-EOF
  {{#startsWith 'g' (downcase request.params.name) }}
    {
      "id": 1,
      "name": "{{capitalizeAll request.params.name }}"
    }
  {{else}}
    {{! You can set the status conditionally from here with the 'setStatus' helper }}
    {{setStatus 404}}
    {
      "error": "Not found error",
      "message": "Cat not found"
    }
  {{/startsWith}}
  EOF
}
