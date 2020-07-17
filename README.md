# Mocko
Mocking made easy, proxy your API and choose which endpoints to mock

## Features
- Manage your mocks in a web UI, no complicated configuration files or CLIs
- Proxy your real API: Requests will be passed through to it unless there's a mock
- Create generic and specific mocks:
    - /cats/{name}
    - /cats/george

## When to use?
- Mocking integrations for tests or non-productive environments
- Mocking integrations for local development
- Mocking your own services on development environment to make it easy to simulate
complicated scenarios
- Mocking your future services on development environment to allow the front end and
the back end to develop in parallel (after that, remove the mock and it'll be proxied
to the real service) 

## Installation
### Using Helm
Installation on your Kubernetes cluster using helm is pretty simple:
```
helm repo add cdt https://cdn.codetunnel.net/helm

helm install mocko cdt/mocko --set \
redis.host=YOUR.REDIS.HOST,\
redis.password=YOUR_REDIS_PASSWORD,\
proxy.uri=http://your-real-api.url/v1
```
The other chart values you might want to change are:
| **Chart Value**     | **Description**                                                                                              | **Default**                              |
|---------------------|--------------------------------------------------------------------------------------------------------------|------------------------------------------|
| proxy.uri           | URL of your actual API which will be proxied by mocko, leave it blank to disable proxying                    | _blank_                                  |
| proxy.timeoutMillis | Milliseconds to wait for a response before replying with 504 Gateway Timeout                                 | 180000                                   |
| proxy.cors          | Set to true to override the cors rules defined by the API. Set to false to proxy OPTIONS requests to the API | true                                     |
| proxy.replicas      | Number of proxy replicas                                                                                     | 1                                        |
| redis.host          | Redis host                                                                                                   | redis-headless.default.svc.cluster.local |
| redis.port          | Redis port                                                                                                   | 6379                                     |
| redis.password      | Redis password                                                                                               | _blank_                                  |
| redis.database      | Redis database                                                                                               | 0                                        |

### Docker Compose complete stack
Clone this repository and start docker compose:
```
git clone https://github.com/gabriel-pinheiro/mocko.git
cd mocko
sudo docker-compose up
```

Access http://localhost:8080/ for the UI. Mocks will be served on `localhost:8081`

To change settings, modify the configuration files on `./compose/config`. You might want to change
`./compose/config/proxy/.env` to enable proxied mode.

### Docker Compose standalone mode
Copy the `./mocko-proxy/mocks.hcl` file to your project root and add this service to your compose:
```yaml
version: '2'

services:
  mocko-proxy:
    image: 'gabrielctpinheiro/mocko-proxy:1.1.0'
    environment:
      - PROXY_BASE-URI=
    ports:
      - '8080:8080'
    volumes:
      - './mocks.hcl:/home/mocko/mocks.hcl'
```
You can set your API URL in the environment variable `PROXY_BASE-URI`.

Any setting can be changed from the environment variables.

Change the mocks.hcl file to update your mocks.


## Usage
You can create, delete and update mocks in the UI when using the complete stack
mode (or when installing with helm).

For standalone mode check
[mocko-proxy's README.md](https://github.com/gabriel-pinheiro/mocko/blob/master/mocko-proxy/README.md)

For templating examples check
[mocko-proxy's examples](https://github.com/gabriel-pinheiro/mocko/tree/master/mocko-proxy/examples)

## For installation, usage or any help, email me:
![](https://cdn.codetunnel.net/gabrielpinheiro/email.png)
