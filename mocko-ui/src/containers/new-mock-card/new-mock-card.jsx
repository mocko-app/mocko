import React, {useContext, useState} from 'react';
import {Card} from "../../components/card/card";
import {Column, Split} from "../../layouts/split/styles";
import {CardText} from "../../components/card/styles";
import {Right} from "../../layouts/right/right";
import {Button} from "../../components/button/button";
import {HeaderInputGroup} from "./header-input";
import {PathInput, StatusInput} from "./styles";
import {MethodPicker} from "../../components/method-picker/method-picker";
import {Mocks} from "../../contexts/mock";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-tomorrow_night_eighties";

const DEFAULT_HEADERS = [{
    id: Date.now(),
    key: 'Content-Type',
    value: 'application/json'
}, {
    id: 0,
    key: '',
    value: ''
}];

const DEFAULT_BODY = '{\n  "foo": "bar"\n}\n';

export function NewMockCard() {
    const [headers, setHeaders] = useState(DEFAULT_HEADERS);
    const [body, setBody] = useState(DEFAULT_BODY);
    const [status, setStatus] = useState(200);
    const [method, setMethod] = useState('GET');
    const [path, setPath] = useState('/cats/{name}');
    const [isLoading, setLoading] = useState(false);
    const { createMock } = useContext(Mocks);

    const buildHeaders = () => Object.fromEntries(headers
        .filter(h => h.key && h.value)
        .map(h => [h.key, h.value]));

    const reset = () => {
        setLoading(false);
        setHeaders(DEFAULT_HEADERS);
        setBody('');
        setStatus(200);
        setPath('');
    };

    const deploy = async () => {
        if(isLoading) {
            return;
        }

        setLoading(true);
        await createMock({
            method, path, response: {
                body, headers: buildHeaders(), code: status
            }
        }).catch(() => alert('Oops, failed to create mock'));
        reset();
    };

    return (
        <Card title="New mock" isLoading={ isLoading }>
            <Split>
                <CardText>Method and path</CardText><br/>
                <MethodPicker value={method} onChange={e => setMethod(e.target.value)}/>
                <PathInput type="text" value={path} onChange={e => setPath(e.target.value)}/>
                <Column>
                    <CardText>Response code</CardText>
                    <StatusInput type="number" value={status} onChange={e => setStatus(parseInt(e.target.value))}/>
                    <CardText>Headers</CardText>
                    <HeaderInputGroup
                        headers={headers}
                        setHeaders={setHeaders}/>
                </Column>
                <Column>
                    <CardText>Response body</CardText>
                    <AceEditor
                        placeholder={DEFAULT_BODY}
                        mode="json"
                        theme="tomorrow_night_eighties"
                        name="body-editor"
                        value={body}
                        onChange={setBody}
                        fontSize={16}
                        height="12rem"
                        width="100%"
                        setOptions={{
                            enableLiveAutocompletion: true,
                            enableBasicAutocompletion: true,
                            tabSize: 2,
                        }}/>
                </Column>
                <Right padding="m">
                    <Button onClick={ deploy }>Save & Deploy</Button>
                </Right>
            </Split>
        </Card>
    );
}
