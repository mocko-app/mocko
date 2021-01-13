#-----------------------------
# status
#-----------------------------
mock "GET /default-status" { }
mock "POST /default-status" { }
mock "GET /other-status" {
    status = 204
}

#-----------------------------
# headers
#-----------------------------
mock "GET /headers" {
    headers {
        x-custom-header = "foo"
    }
}

#-----------------------------
# body
#-----------------------------
mock "GET /body" {
    body = "Hello from Mocko :)"
}
