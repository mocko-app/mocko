import React, {useContext, useState} from 'react';
import {Card} from "../../components/card/card";
import {Column, Split} from "../../layouts/split/styles";
import {CardText} from "../../components/card/styles";
import {Right} from "../../layouts/right/right";
import {Button} from "../../components/button/button";
import {Warning} from "../../components/warning/warning";
import {HeaderInputGroup} from "./header-input";
import {NameInput, PathInput, StatusInput, FieldError} from "./styles";
import {MethodPicker} from "../../components/method-picker/method-picker";
import {Mocks} from "../../contexts/mock";
import AceEditor from "react-ace";
import {useHistory} from "react-router-dom";

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

const DEFAULT_BODY = '';

export function MockCrudCard({ mock, onClose = () => {} }) {
    let defaultHeaders = DEFAULT_HEADERS;
    if(mock) {
        defaultHeaders = [...Object.entries(mock.response.headers), ['', '']]
            .map(([key, value], index) => ({
                key, value, id: index
            }));
    }

    const [headers, setHeaders] = useState(defaultHeaders);
    const [body, setBody] = useState(mock?.response?.body || DEFAULT_BODY);
    const [status, setStatus] = useState(mock?.response?.code || 200);
    const [name, setName] = useState(mock?.name || '');
    const [method, setMethod] = useState(mock?.method || 'GET');
    const [path, setPath] = useState(mock?.path || '');

    const [nameError, setNameError] = useState('');
    const [pathError, setPathError] = useState('');
    const [statusError, setStatusError] = useState('');

    const [isLoading, setLoading] = useState(false);
    const { createMock, updateMock } = useContext(Mocks);
    const history = useHistory();

    const buildHeaders = () => Object.fromEntries(headers
        .filter(h => h.key && h.value)
        .map(h => [h.key, h.value]));

    const deploy = async () => {
        if(isLoading) {
            return;
        }
        let hasErrors = false;

        if(name.length === 0) {
            setNameError('The description cannot be empty');
            hasErrors = true;
        } else {
            setNameError('');
        }

        if(path.length === 0) {
            setPathError('The path cannot be empty');
            hasErrors = true;
        } else {
            setPathError('');
        }

        if(status < 200) {
            setStatusError('The status must be greater than or equal to 200');
            hasErrors = true;
        } else if(status >= 600) {
            setStatusError('The status must be less than 600');
        } else {
            setStatusError('');
        }

        if(hasErrors) {
            return;
        }

        setLoading(true);
        const payload = {
            name, method, path, response: {
                body, headers: buildHeaders(), code: status
            }
        };

        try {
            if(mock) {
                await updateMock(mock.id, payload);
            } else {
                await createMock(payload);
            }
            onClose();
            history.push("/");
        } catch(e) {
            const msg = e?.response?.data?.message?.[0];
            setNameError(msg ? `Oops, ${msg}` : 'Oops, failed to save mock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card isLoading={ isLoading }>
            <Split>
                <Column width='40'>
                    <CardText>Short description</CardText>
                    <NameInput isError={!!nameError} type="text" value={name} onChange={e => setName(e.target.value)}/>
                    {nameError && <FieldError>{nameError}</FieldError>}
                    <CardText>Method and path</CardText><br/>
                    <MethodPicker value={method} onChange={e => setMethod(e.target.value)}/>
                    <PathInput isError={!!pathError} placeholder="/clients/{id}" type="text" value={path} onChange={e => setPath(e.target.value)}/>
                    {pathError && <FieldError>{pathError}</FieldError>}
                    <CardText>Response code</CardText>
                    <StatusInput isError={!!statusError} type="number" value={status} onChange={e => setStatus(parseInt(e.target.value))}/>
                    {statusError && <FieldError>{statusError}</FieldError>}
                    <CardText>Headers</CardText>
                    <HeaderInputGroup
                        headers={headers}
                        setHeaders={setHeaders}/>
                </Column>
                <Column width='60'>
                    <CardText>Response body</CardText>
                    {mock?.failure && <Warning title="There seems to be an issue with your template:">{mock.failure.message}</Warning>}
                    <AceEditor
                        placeholder={DEFAULT_BODY}
                        mode="json"
                        theme="tomorrow_night_eighties"
                        name="body-editor"
                        value={body}
                        onChange={setBody}
                        fontSize={16}
                        height="20rem"
                        width="100%"
                        setOptions={{ tabSize: 2 }}/>
                </Column>
                <Right padding="m">
                    <Button onClick={ deploy }>Save & Deploy</Button>
                </Right>
            </Split>
        </Card>
    );
}
