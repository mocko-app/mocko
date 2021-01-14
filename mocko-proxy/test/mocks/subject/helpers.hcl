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

#-----------------------------
# flags
#-----------------------------
mock "PUT /flag/{value}" {
    body = "{{setFlag 'test_flag' request.params.value}}"
}

mock "GET /flag" {
    body = "{{getFlag 'test_flag'}}"
}

mock "DELETE /flag" {
    body = "{{delFlag 'test_flag'}}"
}

mock "GET /has-flag" {
    body = <<EOF
    {{#hasFlag 'test_flag'}}
        yes
    {{else}}
        no
    {{/hasFlag}}
    EOF
}

mock "GET /has-flag-noelse" {
    body = <<EOF
    {{#hasFlag 'test_flag'}}
        yes
    {{/hasFlag}}
    EOF
}
