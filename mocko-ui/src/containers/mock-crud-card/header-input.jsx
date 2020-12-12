import React from "react";
import {KeyValueInput} from "../../components/key-value-input/key-value-input";

export function HeaderInputGroup({ headers, setHeaders }) {
    const emptyHeader = () => ({
        id: Date.now(),
        key: '',
        value: ''
    });

    const removeHeader = id => {
        setHeaders(headers.filter(h => h.id !== id));

        if(headers.length === 1) {
            setHeaders([emptyHeader()]);
        }
    }

    const changeHeader = (id, key, value) => {
        const newHeaders = headers.map(h => h.id !== id ? h : {
            id, key, value
        });

        if(newHeaders.length < 10 && newHeaders.filter(h => !h.key && !h.value).length === 0) {
            newHeaders.push(emptyHeader());
        }

        setHeaders(newHeaders);
    };

    return headers.map(header =>
            <KeyValueInput
                key={ header.id }
                keyStr={ header.key }
                value={ header.value }
                onRemove={ () => removeHeader(header.id) }
                onChange={ (key, value) => changeHeader(header.id, key, value) }/>);
}
