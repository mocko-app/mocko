import React, {useState} from 'react';
import {Card} from "../../components/card/card";
import {Column, Split} from "../../layouts/split/styles";
import {CardText} from "../../components/card/styles";
import {TextArea} from "../../components/text-area/text-area";
import {Right} from "../../layouts/right/right";
import {Button} from "../../components/button/button";
import {HeaderInputGroup} from "./header-input";
import {PathInput, StatusInput} from "./styles";
import {MethodPicker} from "../../components/method-picker/method-picker";

const DEFAULT_HEADERS = [{
    id: Date.now(),
    key: 'Content-Type',
    value: 'application/json'
}, {
    id: 0,
    key: '',
    value: ''
}];

export function DumbNewMockCard({ onDeploy }) {
    const [headers, setHeaders] = useState(DEFAULT_HEADERS);
    const [body, setBody] = useState('{\n  "foo": "bar"\n}\n');
    const [status, setStatus] = useState(200);
    const [method, setMethod] = useState('GET');
    const [path, setPath] = useState('/cats/{name}');
    const [isLoading, setLoading] = useState(false);

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
        await onDeploy(buildHeaders(), body, status, method, path);
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
                    <StatusInput type="number" value={status} onChange={e => setStatus(e.target.value)}/>
                    <CardText>Headers</CardText>
                    <HeaderInputGroup
                        headers={headers}
                        setHeaders={setHeaders}/>
                </Column>
                <Column>
                    <CardText>Response body</CardText>
                    <TextArea value={body} onChange={e => setBody(e.target.value)}/>
                </Column>
                <Right padding="m">
                    <Button onClick={ deploy }>Save & Deploy</Button>
                </Right>
            </Split>
        </Card>
    );
}

export function NewMockCard() {
    return <DumbNewMockCard onDeploy={ console.log }/>
}
