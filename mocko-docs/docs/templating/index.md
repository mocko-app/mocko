# Templating
## Before we begin
Templating is where Mocko really shines, it allows you to create dynamic mocks and simulate
complicated scenarios with ease. You can use templating in any installation of Mocko, either
standalone mode, complete stack or hybrid.

To use templating you must have a working installation of Mocko, either locally or in a server
or cluster. If you don't, don't worry, it'll take you just a few minutes to
[get started by clicking here](https://cdt.one/6HVALVQ).

In our examples we'll show only the templates, in your standalone installation, they go in the
`body` parameter of the `mock` stanza. In your complete stack, they go in the `Body` text field
in the mock creation context (full-screen dialog).

## Handlebars
When defining your `body` template, you can use [Handlebars](https://cdt.one/2uUTC56), a
minimal templating language. In a `GET /cats/{name}` mock, the following body template:
```json
{
	"id": 1,
	"name": "{{ request.params.name }}"
}
```
Would produce a response like this in a `GET /cats/george`:
```json
{
	"id": 1,
	"name": "george"
}
```

Other than that, you can use helpers from the [handlebars-helpers](https://cdt.one/HsePEbR)
repository. Here's an example:
```json
{
	"id": 1,
	"name": "{{capitalizeAll request.params.name }}"
}
```
Producing on `GET /cats/george`:
```json
{
	"id": 1,
	"name": "George"
}
```

## Context
You can access several fields from the request from your template:

- `request.params`: Params you defined in the URL
- `request.headers`: Request headers
- `request.query`: Query parameters (the part after `?` in the URL)
- `request.body`: Fields from the request body, when sent as JSON

Here's an example using some of them, `PUT /cats/{id}`:
```js
{
	"id": {{ request.params.id }},
	"name": "{{ request.body.name }}",
	"key": "{{ request.headers.x-key }}"
}
```

## Blocks
You can use block helpers to perform conditionals or loops in your template, here is an example on `GET /cats/{name}`:

```java
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
```

You can open block helpers with a `#` before its name and close with a `/` before it. Also, block helpers
can have `else` blocks like in the example above.

You might have noticed that we used the `downcase` helper inside the `startsWith` helper, that is totally
possible and you can nest as many of them as you want. You call nested helpers with parenthesis (`(` and `)`).

You can add comments to your templates with `!` like in the example above.

As you might have noticed, we used a special Mocko helper `setStatus` to change the status dynamically. In the
example above, the status will be changed to 404 when the condition is false and the `else` block is called.

## Special helpers
Other than the [handlebars-helpers](https://cdt.one/y2xw8gZ), Mocko provides you with
special helpers that can change your response directly, here are some of them:

#### `setStatus` helper
Lets you set the response status dynamically or conditionally.
Example `GET /cats/{id}`:
```java
{{#is request.params.id '1'}}
	{
		"id": 1,
		"name": "George"
	}
{{else is request.params.id '2'}}
	{
		"id": 2,
		"name": "Alice"
	}
{{else}}
	{{! You can set the status conditionally from here with the 'setStatus' helper }}
	{{setStatus 404}}
	{
		"error": "Not found error",
		"message": "Cat not found"
	}
{{/is}}
```


#### `setHeader` helper
Lets you set response headers dynamically or conditionally.
Example `GET /purchase-tasks/{id}`:
```java
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
```

#### `proxy` helper
Lets you proxy conditionally to the actual API behind mocko. You can choose the URL to proxy with
the config `PROXY_BASE-URI` in the `mocko-proxy` module, either in the `.env` file or with an
environment variable. If you're using the Mocko CLI, you can use the flag `--url` or `-u` instead.

In the example below we're mocking empty posts for user with id 1:

- `GET /posts?userId=1` will be mocked
- `GET /posts?userId=2` (and other users) will be proxied to the real API

Example `GET /posts`
```java
{{! If the query "userId" is 1, return an empty array, otherwise proxy to the real API }}
{{#is request.query.userId 1}}
	[]
{{else}}
	{{proxy}}
{{/is}}
```

Alternatively, you can override the proxy URI for a specific mock by passing the URI as a parameter
to the `proxy` helper, the following example would proxy any request for paths starting with `/v2/`
to `localhost:8081`:
```java
mock "* /v2/{any*}" {
	body = "{{proxy 'http://localhost:8082'}}"
}
```

<!-- TODO ## Flags helpers -->

## Tips and tricks

#### Logging
You can log anything to Mocko's console with the `log` helper, here are some examples:

`POST /cats`
```java
{{log 'Received a request to create a cat named ' request.body.name ' of age ' request.body.age }}
{
	"id": {{random 1 100}}
}
```

`GET /cats/{id}`
```java
{{#is request.params.id '1'}}
	{
		"id": 1,
		"name": "George"
	}
{{else is request.params.id '2'}}
	{
		"id": 2,
		"name": "Alice"
	}
{{else}}
	{{log 'Trying to fetch unknown cat with id ' request.params.id }}
	{{setStatus 404}}
	{
		"error": "Not found error",
		"message": "Cat not found"
	}
{{/is}}
```

You can also log the parameters you are receiving to make it easier to develop the templates:
```java
{{log (JSONstringify request)}}
```

<!-- TODO next steps -->
<!-- TODO reference to https://github.com/gabriel-pinheiro/mocko/tree/master/mocko-proxy/examples -->
<img src="https://cdt.one/j1yTLWq.gif" style="display: none;"/>
