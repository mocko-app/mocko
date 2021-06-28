# Mocko Helpers
Other than the [handlebars-helpers](https://cdt.one/y2xw8gZ), Mocko provides you with
special helpers that can change your response directly, here are some of them:

## `setStatus`
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


## `setHeader`
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

## `proxy`
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

Alternatively, you can override the proxy URI for a specific mock by passing it as a parameter to
`proxy` helper:
```java
{{#is request.params.id '1'}}
    {{proxy 'http://localhost:8082'}}
{{else}}
    {{proxy 'http://localhost:8081'}}
{{/is}}
```

## `append`
You can use the `append` helper to concatenate its parameters as a string:
```
{{append 'users:' request.params.id ':name'}}
```

## `uuid`
Generates an UUID v4. No parameters required.

## `substring`
Returns a substring:
```
{{substring 'Lorem ipsum' 0 4}}
{{! This will produce 'Lore' }}
```

Same usage as [JavaScript's substring](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/String/substring).

## `setFlag`, `getFlag`, `delFlag`, `hasFlag`

Check their documentation under [persistence](https://mocko.dev/docs/templating/persistence/).

## `get`, `set`

Check their documentation under [variables](https://mocko.dev/docs/templating/variables/).
