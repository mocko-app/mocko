<base href="https://mocko.dev" target="_blank"/>

# Deploying

Now that you know how to use Mocko, let's get it running in the
internet so you can access it from anywhere, not only your computer.

## The free, easiest and quickest way

Click the button below to deploy the app to [glitch.com](https://cdt.one/UUBAcUL), it's free and you don't need to register:

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://cdt.one/zAXGDPb)

Wait until the app is deployed (check `Tools -> Logs` in the bottom left corner) and access it with the URL provided in the `Show -> In a New Window` button in the top left corner.

In the files drawer on the left, you can change the mocks inside the `mocks` folder and they'll update in real time, check our [Getting Started](https://mocko.dev/getting-started/standalone/) guide for usage.

To one-click deploy to other PaaS providers like Heroku or DigitalOcean's App Platform, check [mocko-example](https://cdt.one/tsXeJfu)'s `README.md`.

## Standalone mode

Our CLI is cross-platform so you could easily install it in a VPS or container.
However, its additional development features (like watch mode, the CLI itself,
update checking) make it less lightweight than running mocko-proxy itself.

To run Mocko using as little resources as possible, you can create a container
image with your mocks and `gabrielctpinheiro/mocko-proxy` as a base. Create a file
structure like so:

```text
mocko-project
├── Dockerfile
└── mocks
    └── main.hcl
```

Inside `Dockerfile` put:
```sh
FROM 'gabrielctpinheiro/mocko-proxy'
COPY ./mocks ./mocks
```

And in the `mocks` folder you can create your mock definitions, check our [Getting Started](https://mocko.dev/getting-started/standalone/) guide for usage.

To change Mocko settings you can define envionment variables in your `Dockerfile` like so:
```sh
FROM 'gabrielctpinheiro/mocko-proxy'
COPY ./mocks ./mocks
ENV PROXY_BASE-URI=https://my-real-api.tld/v1
```

You can check all the available and default values here:

[https://github.com/gabriel-pinheiro/mocko/blob/master/mocko-proxy/default.env](https://github.com/gabriel-pinheiro/mocko/blob/master/mocko-proxy/default.env)

## Complete stack on Kubernetes with Helm

You can easily install Mocko complete stack (with just three commands) in your cluster using Helm:

**Helm 3**
```shell
$ git clone https://github.com/gabriel-pinheiro/mocko.git
$ cd mocko

$ helm install mocko ./mocko-helm --set \
redis.host=YOUR.REDIS.HOST,\
redis.password=YOUR_REDIS_PASSWORD,\
proxy.uri=http://your-real-api.url/v1
```

**Helm 2**
```shell
$ git clone https://github.com/gabriel-pinheiro/mocko.git
$ cd mocko

$ helm install ./mocko-helm -n mocko --set \
redis.host=YOUR.REDIS.HOST,\
redis.password=YOUR_REDIS_PASSWORD,\
proxy.uri=http://your-real-api.url/v1
```
The other chart values you might want to change are:
<table>
<thead>
<tr>
<th><strong>Chart Value</strong></th>
<th><strong>Description</strong></th>
<th><strong>Default</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>proxy.uri</td>
<td>URL of your actual API which will be proxied by mocko, leave it blank to disable proxying</td>
<td><em>blank</em></td>
</tr>
<tr>
<td>proxy.timeoutMillis</td>
<td>Milliseconds to wait for a response before replying with 504 Gateway Timeout</td>
<td>180000</td>
</tr>
<tr>
<td>proxy.cors</td>
<td>Set to true to override the cors rules defined by the API. Set to false to proxy OPTIONS requests to the API</td>
<td>true</td>
</tr>
<tr>
<td>proxy.replicas</td>
<td>Number of proxy replicas</td>
<td>1</td>
</tr>
<tr>
<td>redis.host</td>
<td>Redis host</td>
<td>redis-headless.default.svc.cluster.local</td>
</tr>
<tr>
<td>redis.port</td>
<td>Redis port</td>
<td>6379</td>
</tr>
<tr>
<td>redis.password</td>
<td>Redis password</td>
<td><em>blank</em></td>
</tr>
<tr>
<td>redis.database</td>
<td>Redis database</td>
<td>0</td>
</tr>
</tbody>
</table>
