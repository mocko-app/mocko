# Defining custom data that can be used in multiple mocks
data "cats" {
  cat {
    id   = 0
    name = "Alice"
  }

  cat {
    id   = 1
    name = "Bob"
  }

  cat {
    id   = 2
    name = "Claire"
  }
}

data "errors" {
  notFound {
    error   = "Not found error"
    message = "Cat not found"
  }
}

# Using this to debug what is under data
mock "GET /data" {
  headers {
    Content-Type = "application/json"
  }

  body = "{{{JSONstringify data }}}"
  # Another options would be logging to console:
  # body = "{{log (JSONstringify data) }}"
}

# Mocking cat resources using data
mock "GET /cats/{name}" {
  status = 200

  headers {
    Content-Type = "application/json"
  }

  # Using this template, we could add any cat we want to the data without having to touch this
  body = <<-EOF
  {{! Check if there is a cat with the specified name }}
  {{#inArray (split (downcase (join (pluck data.cats.cat "name") ',')) ',') (downcase request.params.name)}}
    {{! For each cat, check if it's the one we want and print it}}
    {{#each data.cats.cat}}
      {{#eq (downcase name) (downcase ../request.params.name)}}
        {{{JSONstringify .}}}
      {{/eq}}
    {{/each}}
  {{else}}
    {{! The cat we want isn't in the array, set the status to 404 and return a not found error}}
    {{setStatus 404}}
    {{{JSONstringify data.errors.notFound.[0]}}}
  {{/inArray}}
  EOF
}
