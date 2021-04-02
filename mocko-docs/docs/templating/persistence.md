# Persistence
Mocko allows you to use Flags, which are values that are persisted between requests or even between restarts when Redis
is enabled on mocko-proxy's config (enabled by default on complete stack and disabled by default on standalone mode) or in-memory otherwise.

## Getting started
For the first example, let's create a `PUT /message/{message}` which will save the `message` param in a flag and a
`GET /message` which will return that message in the response body:
```java
mock "PUT /message/{message}" {
    body = <<EOF
        {{! Here we are setting the value of a flag named `msg` to the value of the parameter `message` }}
        {{setFlag 'msg' request.params.message}}
    EOF
}

mock "GET /message" {
    body = <<EOF
        {{getFlag 'msg'}}
    EOF
}
```

Now let's make a request to set the message to `potato`:
```shell
$ curl -X PUT http://localhost:8080/message/potato
```

And if we get the message, the value we set before is returned:
```shell
$ curl http://localhost:8080/message
potato
```

Also, if you are using the complete or hybrid stack, you can check the flag we just created in the UI:

![Flags interface](https://cdn.codetunnel.net/mocko/docs--flag-1-1.png)

## More helpers
Other than setting and getting flags, you can also check whether they exist
and delete them. Let's make our previous exemple a little better by adding a
`DELETE /message` that clears the message and returning 404 when no message
is set.
```java
mock "PUT /message/{message}" {
    body = <<EOF
        {{! Here we are setting the value of a flag named `msg` to the value of the parameter `message` }}
        {{setFlag 'msg' request.params.message}}
    EOF
}

mock "GET /message" {
    body = <<EOF
        {{#hasFlag 'msg'}}
            {{getFlag 'msg'}}
        {{else}}
            {{setStatus 404}}
            No message is set
        {{/hasFlag}}
    EOF
}

mock "DELETE /message" {
    body = "{{delFlag 'msg'}}"
}
```

Now we can delete the flag we just created:
```shell
$ curl -X DELETE http://localhost:8080/message
```

And if we GET is again, a 404 will be returned:
```shell
$ curl -D - http://localhost:8081/message

HTTP/1.1 404 Not Found
No message is set
```

## Dynamic flags
You can use data sent in the request to generate a flag's name, that way, you can save multiple resources. Let's create
an example where you can create users and get them later:
```python
mock "POST /users" {
    headers {
        Content-Type = "application/json"
    }
    body = <<EOF
        {{! Here we are creating an UUID and saving it to
            the variable 'id', this is not a flag and is not
            persisted, you can check more about it here:
            https://mocko.dev/templating/variables
        }}
        {{set 'id' (uuid)}}

        {{! Creating a flag name like users:ID_HERE:name, in the UI `:` are interpreted as folder breaks}}
        {{setFlag (append 'users:' (get 'id') ':name') request.body.name}}
        {{setFlag (append 'users:' (get 'id') ':age') request.body.age}}

        {{! Returning the id we saved to the flags }}
        {
            "id": "{{get 'id'}}"
        }
    EOF
}
```
```js
mock "GET /users/{id}" {
    body = <<EOF
        {{#hasFlag (append 'users:' request.params.id ':name')}}
            Hello! My name is {{getFlag (append 'users:' request.params.id ':name')}}
            and I'm {{getFlag (append 'users:' request.params.id ':age')}} years old
        {{else}}
            {{setStatus 404}}
        {{/hasFlag}}
    EOF
}
```

Now we can create users with:
```shell
$ curl -X POST http://localhost:8080/users -d '{"name": "George", "age": 95}' -H  'Content-Type: application/json'
{
    "id": "8dfad38d-56e9-4210-8dfa-1c8f9da213f2"
}
```

And get their data with:

```shell
$ curl http://localhost:8080/users/8dfad38d-56e9-4210-8dfa-1c8f9da213f2
Hello! My name is George
and I'm 95 years old
```

As we are using the generated id as part of the key, creating a new user doesn't override the old ones and you can store
as many as you want. Also, by separating the flag with `:`, it'll appear grouped in folders in the UI:

<img src="https://cdn.codetunnel.net/mocko/docs--flag-2-1.png" alt="Flags interface" width="100%">
