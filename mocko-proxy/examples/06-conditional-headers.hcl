# Mocking purchase tasks
mock "GET /purchase-tasks/{id}" {
  headers {
    Content-Type = "application/json"
  }

  body = <<-EOF
    {{#gt (toInt request.params.id) 10}}
      {{! Simulating completed tasks with id greater than 10 }}
      {{setStatus 303}}
      {{setHeader 'Location' (append '/purchases/' request.params.id)}}
    {{else}}
      {{! Simulating random progress tasks otherwise }}
      {
        "id": {{request.params.id}},
        "progress": {{random 0 100}}
      }
    {{/gt}}
  EOF
}
