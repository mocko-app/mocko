# Getting Started
with Standalone Mode

---

## Installation
Let's get started with Mocko CLI, a command line utility that lets you serve your
mocks with ease and provides you with great features to make it easier to develop
them.

<div class="alert alert-warning" role="alert">
	You need NodeJS 12 or newer installed for this part.
	<a href="https://cdt.one/BDSDgYN" target="_blank">Click here</a> to check our guide on updating
</div>

First install the Mocko CLI with npm:
```shell
npm i -g @mocko/cli
```

Alternatively, **you might need `sudo` for Linux or Mac**:
```shell
sudo npm i -g @mocko/cli
```

Check the installation with the `--help` flag for the help screen:
```shell
$ mocko --help
Usage: mocko [options] <path to mocks folder>
Example: mocko -p 4000 mocks

Options:                    

  -h, --help       Shows this screen
  -v, --version    Shows the current version
  -w, --watch      Watches for file changes and restarts the server
  -p, --port       Port to serve the mocks (8080)
  -u, --url        URL to proxy requests when no mock is defined
  -t, --timeout    Max time to wait for a response from the proxied URL in millis (30000)
```

## Creating your first project
Now that you have Mocko CLI installed, let's create your first Mocko project, create a
folder with a `.hcl` file inside, a simple structure like this:
```text
hello-mocko
└── first-mocks.hcl
```

And, in your `.hcl` file (like our `first-mocks.hcl`), create your first mock with the
`mock` stanza:

```js
mock "GET /hello" {
	body = "Hello from Mocko!"
}
```
<div class="alert alert-info" role="alert">
	Your IDE or editor will most likely have an extension for <code>.hcl</code> syntax highlighting.
	It might help :)
</div>

## Using Mocko
Now that you have Mocko CLI installed and your first project created, we're ready to begin. Inside your
project folder, start Mocko by running the command:
```shell
mocko --watch ./
```

And, as easy as that, your mocks are now being served on port 8080. If you want to change the port,
you can use the `--port` flag to choose another one. Also, the `--watch` flag we've used makes Mocko
auto reload the changes you save to your mock definitions. The `./` in the command is the folder
that contains your mocks (or folder with folders of them), as we're inside it, we used `./` but you
could pass any path.

To see your mock being served you can use any HTTP client like [Insomnia](https://insomnia.rest/download/),
[HTTPie](https://httpie.io/), [cURL](https://curl.se/) or, in this case as its a `GET` request, even your
browser. Simply access [http://localhost:8080/hello](http://localhost:8080/hello) in your browser or, with
curl:
```shell
$ curl http://localhost:8080/hello
Hello from Mocko!
```

## The `mock` stanza
The mocks are defined using HCL, you can check it's documentation [here](https://github.com/hashicorp/hcl).

Our first mock was super easy to create but is too simple, let's zhuzh is up a bit =P

You can have multiple mocks in a file so let's add a comment to our first one, just to
identify it, and create a new mock:
```python
# Our first, simple, hello mock
mock "GET /hello" {
	body = "Hello from Mocko!"
}

# Mocking George, the cat
mock "GET /cats/george" {
	# This is how you set response status, it's optional and defaults to 201 for POST and 200 for other methods
	status = 200

	# Headers are defined in a map, don't forget your content type
	headers {
		Content-Type = "application/json"
	}

	# You can use multi-line strings for your body
	body = <<EOF
	{
		"id": 1,
		"name": "George"
	}
	EOF
}
```
And now let's understand it a little better:

#### Method and path
You define the method and path right after the mock stanza. They're interpreted by
[Hapi Call](https://hapi.dev/module/call), you can check
[its documentation here](https://hapi.dev/module/call/api/?v=8.0.1).

You can choose any method or `*` to match all. For the path, you can use specific paths like
`/cats/george` or generic ones like `/cats/{name}`. Specific paths will always be matched with higher priority, if you had two mocks:

```js
mock "GET /cats/george" { status = 204 }
mock "GET /cats/{name}" { status = 404 }
```
A get to `/cats/george` would never trigger the last mock (generic) regardless of the order, only the
first one (specific). Other calls like `/cats/alice` would trigger the latter.

For more advanced path matching like optional parameters, multi-segment parameters or even catch-all parameters,
check [Hapi Call's documentation here](https://hapi.dev/module/call/api/?v=8.0.1).

#### `status` parameter
Not much to say here... You can choose any status from `200` to `599`. It defaults to `201` for `POST`
mocks or `200` for anything else.

#### `headers` parameter
Here you can specify your headers in a map like so:
```js
headers {
	Content-Type    = "application/json"
	X-Custom-Header = "Mocko is amazing :O"
}
```

Don't forget your `Content-Type` header =P

#### `delay` parameter
While we didn't use it yet, you could specify a `delay` parameter to add a delay to your response, you can
choose any number in milliseconds.

#### `body` parameter
All of Mocko's magic is in this parameter... But we won't go deep here yet :X

There is an entire section about templating that you can learn more about this. Don't worry, we'll remind
you in the end of this page.

## Structuring your mocks
Your mocks don't need to be in the root of your folder, they can be inside folders in any deepness. Also,
you can define multiple mocks in the same file. Here's a folder structure example:
```text
.
├── user
│   ├── homepage.hcl
│   └── profile.hcl
└── wallet
    ├── credit
    │   ├── credit.hcl
    │   └── indication.hcl
    ├── payment
    │   ├── creditcard.hcl
    │   └── gateway.hcl
    └── refund.hcl
```

## Next steps
Before moving on, how about leaving us a star on GitHub? It'll take you two clicks, first [here](https://cdt.one/fZLdEhZ) and then on star :)

Now that you learned to use Mocko CLI, learned to create your mocks using HCL, structure them in a project
and even gave us an [star on GitHub](https://cdt.one/fZLdEhZ) (right?) it's time to learn the main functionality of Mocko: templating.
With it, you can create dynamic mocks, write logic for them so that you can simulate the more complicated
scenarios. See you there :)

<div class="d-flex justify-content-center">
	<a class="btn btn-primary btn-lg" href="https://cdt.one/zGZtUpU" role="button">Go to Templating</a>
</div>
<img src="https://cdt.one/zDX75Ml.gif" style="display: none;"/>
