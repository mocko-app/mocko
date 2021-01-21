mock "GET /hello" {
    body = "hello from mocko-content"
}

mock "POST /validate/body" {
    body = <<EOF
    {{#compare request.body.foo '!==' 'bar'}}
        {{setStatus 400}}
    {{/compare}}
    EOF
}

mock "POST /validate/header" {
    body = <<EOF
    {{#compare request.headers.x-foo '!==' 'bar'}}
        {{setStatus 400}}
    {{/compare}}
    EOF
}

mock "POST /validate/query" {
    body = <<EOF
    {{#compare request.query.foo '!==' 'bar'}}
        {{setStatus 400}}
    {{/compare}}
    EOF
}
