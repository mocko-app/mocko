mock "PUT /maintenance" {
  body = "{{setFlag 'maintenance' true}}"
}

mock "DELETE /maintenance" {
  body = "{{delFlag 'maintenance'}}"
}

mock "GET /maintenance" {
  body = <<EOF
  {{#hasFlag 'maintenance'}}
    {
      "status": "MAINTENANCE"
    }
  {{else}}
    {
      "status": "UP"
    }
  {{/hasFlag}}
  EOF
}
