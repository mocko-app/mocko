mock "GET /hello" {
    body = "hello from mocko-content"
}

mock "GET /v1/host-one" { }
mock "GET /v2/host-two" { }
mock "GET /{version}/host-default" {
    body = "{{request.params.version}}"
}
mock "GET /{version}/host-generic" {
    body = "{{request.params.version}}"
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
