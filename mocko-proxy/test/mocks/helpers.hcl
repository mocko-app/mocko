#-----------------------------
# context
#-----------------------------
mock "GET /ctx/param/{param}" {
    body = "{{request.params.param}}"
}
mock "GET /ctx/header" {
    body = "{{request.headers.x-header}}"
}
mock "POST /ctx/body" {
    body = "{{request.body.foo}}"
}
mock "GET /ctx/query" {
    body = "{{request.query.foo}}"
}

#-----------------------------
# helpers
#-----------------------------
mock "GET /hbs-helpers" {
    body = <<EOF
        {{capitalizeAll 'foo' }}
    EOF
}

mock "GET /set-status" {
    status = 404
    body = "{{setStatus 202}}"
}

mock "GET /set-header" {
    body = "{{setHeader 'x-foo' 'bar'}}"
}

mock "GET /override-header" {
    headers {
        x-foo = "wrong"
    }
    body = "{{setHeader 'x-foo' 'bar'}}"
}
