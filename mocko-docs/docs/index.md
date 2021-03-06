<div class="jumbotron">
    <h1 class="display-4">Mocko</h1>
    <p class="lead">Mocking made easy, create dynamic mocks, proxy your API and choose which endpoints to mock</p>
    <div class="text-center">
        <a class="btn btn-primary btn-lg" href="https://cdt.one/L9ck7Gl" role="button">Quick Start</a>
    </div>
</div>
<!-- TODO add image -->
## Features
- Choose how to manage your mocks
    - Use a simple web UI for speed
    - Use HCL files for documentation and versioning
- Proxy your real API: Requests will be passed through to it unless there's a mock
- Create dynamic mocks using Handlebars (more [here](https://mocko.dev/templating))
- Easy to deploy: You can deploy it in containers or even using a CLI <!-- TODO reference for deploy doc -->
- Really, **really** fast. Run your tests as fast as you can.

## Use cases
- Mocking integrations for tests, non-productive environments or local development
- Mocking your own services on development environment to make it easy to simulate
complicated scenarios
- Mocking your future services on development environment to allow the front end and
the back end to develop in parallel (after that, delete the mock and it'll be automatically
proxied to the real service) 

## Getting started
There are two ways to use Mocko, let's get started with the one that fits your needs
the most:

### Mocko Standalone Mode
- Manage your mocks in configuration files
    - Great for documenting and versioning your mocks in a repository
    - Great when you need a lot of mocks: Structure your mocks in folders
    for easier organization
- Only one service
    - Lightweight: Built on top of [Hapi](https://hapi.dev/), a very lightweight framework
    - Run anywhere, one process that you can spin with docker or the mocko CLI
- Develop locally with a CLI
    - Serve your dynamic mocks with one command
    - Restarts automatically with changes
    - Easy to debug: Reports errors with your configurations in a human readable way
<div class="d-flex justify-content-center">
    <a class="btn btn-primary btn-lg" href="https://cdt.one/Q6afhJ4" role="button">Get started with the Standalone Mode</a>
</div>
<br/>

### Mocko Complete Stack
- Manage your mocks in a web UI, no configuration files or CLIs
    - Great for running in your cluster for your team to create scenarions on-the-go
    - No need to deploy on changes, in a click of a button your mocks are updated
- Three services + [Redis](https://cdt.one/gFlZdpS)
    - You'll need a [Redis](https://cdt.one/gFlZdpS) in your cluster to run this configuration
    - For local development, the docker-compose already includes the redis
- Run locally with [docker-compose](https://cdt.one/CUemuMt) or remotely with [Helm](https://cdt.one/AuWLMKA)
    - Install it in your Kubernetes cluster with one command
    - Run it locally with docker-compose


<div class="d-flex justify-content-center">
    <a class="btn btn-primary btn-lg" href="https://cdt.one/EKAUL29" role="button">Get started with the Complete Stack</a>
</div>
<img src="https://cdt.one/v2v5MZS.gif" style="display: none;"/>
