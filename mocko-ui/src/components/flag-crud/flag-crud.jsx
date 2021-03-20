import React, {useEffect, useState} from 'react';
import AceEditor from "react-ace";
import { client } from '../../utils';

export function FlagCrud({ flag }) {
    const [value, setValue] = useState('Loading...');

    useEffect(() => {
        setValue('Loading...');
        client.get('/flags/' + flag).then(({ data }) =>
            setValue(JSON.stringify(JSON.parse(data.value), null, '\t')));
    }, [flag]);

    return (
        <AceEditor
            mode="json"
            theme="tomorrow_night_eighties"
            name="flag"
            value={value}
            fontSize={16}
            height="100%"
            width="24rem"
            readOnly
            style={{
                marginTop: '0',
                backgroundColor: '#030303'
            }}
            setOptions={{
                tabSize: 2,
                highlightActiveLine: false,
                highlightGutterLine: false,
            }}/>
    );
}
