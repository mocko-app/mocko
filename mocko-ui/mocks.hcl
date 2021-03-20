mock "GET /flags" {
    delay = 500
    body = <<EOF
    {{#is request.query.prefix ""}}
        [{
            "type": "PREFIX",
            "name": "user"
        }, {
            "type": "PREFIX",
            "name": "card"
        }, {
            "type": "PREFIX",
            "name": "errors"
        }, {
            "type": "FLAG",
            "name": "oosfdfsdioidsfz"
        }]
    {{else is request.query.prefix "user:"}}
        [{
            "type": "PREFIX",
            "name": "7b9814de-035b-4599-8563-79ee3fb25b06"
        }, {
            "type": "PREFIX",
            "name": "ba8ef8cf-4d6f-4309-985c-2ab9007e4092"
        }, {
            "type": "PREFIX",
            "name": "e17d8869-1aa1-4346-b420-2d51ba9e8517"
        }, {
            "type": "PREFIX",
            "name": "5009eebd-1b63-4cad-a7a5-2cac47ab7ed0"
        }, {
            "type": "PREFIX",
            "name": "402e6c96-269f-4c5f-bee2-242847ccfe69"
        }]
    {{else is request.query.prefix "card:"}}
        [{
            "type": "PREFIX",
            "name": "1"
        }, {
            "type": "PREFIX",
            "name": "2"
        }, {
            "type": "PREFIX",
            "name": "3"
        }]
    {{else startsWith "user:" request.query.prefix}}
        [{
            "type": "FLAG",
            "name": "name"
        }, {
            "type": "FLAG",
            "name": "card_id"
        }, {
            "type": "FLAG",
            "name": "age"
        }]
    {{else}}
        []
    {{/is}}
    EOF
}
