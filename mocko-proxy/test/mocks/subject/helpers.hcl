data "arr" {
    arr { }
}

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

mock "GET /set-status-ooc" {
    status = 404
    body = <<EOF
        {{#each data.arr.arr}}
            {{setStatus 202}}
        {{/each}}
    EOF
}

mock "GET /set-status/{status}" {
    status = 404
    body = "{{setStatus request.params.status}}"
}

mock "GET /set-header" {
    body = "{{setHeader 'x-foo' 'bar'}}"
}

mock "GET /set-both-headers" {
    headers {
        x-mocked = "foo"
    }
    body = "{{setHeader 'x-dynamic' 'bar'}}"
}

mock "GET /override-header" {
    headers {
        x-foo = "wrong"
    }
    body = "{{setHeader 'x-foo' 'bar'}}"
}

mock "GET /override-header-upper" {
    headers {
        x-foo = "wrong"
    }
    body = "{{setHeader 'X-Foo' 'bar'}}"
}

mock "GET /override-header-lower" {
    headers {
        X-Foo = "wrong"
    }
    body = "{{setHeader 'x-foo' 'bar'}}"
}

mock "GET /dynamic-header/{shouldSet}" {
    body = "{{#is request.params.shouldSet 'true'}}{{setHeader 'X-Foo' 'bar'}}{{/is}}"
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

mock "GET /flag/{flag}" {
    body = "{{getFlag request.params.flag}}"
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

#-----------------------------
# vars
#-----------------------------
mock "GET /vars/1" {
    body = <<EOF
        {{set 'foo' 'bar'}}
        {{get 'foo'}}
    EOF
}

mock "GET /vars/2" {
    body = <<EOF
        {{set 'foo' 'WRONG'}}
        {{#eq true true}}
            {{set 'foo' 'bar'}}
        {{/eq}}
        {{#hasFlag 'anything'}}{{/hasFlag}}
        {{get 'foo'}}
    EOF
}

mock "GET /vars/3" {
    body = <<EOF
        {{set 'foo' 'bar'}}
        {{get 'foo'}}
        {{set 'foo' 'WRONG'}}
        {{#hasFlag 'anything'}}{{/hasFlag}}
    EOF
}

mock "GET /vars/4" {
    body = <<EOF
        {{#each data.arr.arr}}
            {{set 'foo' 'bar'}}
        {{/each}}

        {{get 'foo'}}
    EOF
}

#-----------------------------
# util helpers
#-----------------------------
mock "GET /helpers/uuid" {
    body = "{{uuid}}"
}

mock "GET /helpers/substring/1" {
    body = "{{substring 'Lorem ipsum' 0 4}}"
}

mock "GET /helpers/substring/2" {
    body = "{{substring 'Lorem ipsum' 8}}"
}
