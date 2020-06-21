import React, {useEffect, useState} from 'react';
import {List} from "../../components/list/list";
import {MockItem} from "../mock-item/mock-item";
import {Spinner} from "../../components/spinner/spinner";
import {client} from "../../utils";

export function DumbMockList({ mocks, removeMock }) {
    return (
        <List>
            {mocks.map(mock =>
                <MockItem key={mock.id} method={mock.method} path={mock.path} onRemove={() => removeMock(mock.id)}/>)}
        </List>
    );
}

export function MockList() {
    const [mocks, setMocks] = useState(null);

    useEffect(() => {
        client.get('/mocks')
            .then(({ data }) => setMocks(data));
    }, [setMocks]);

    const removeMock = id => {
        client.delete(`/mocks/${id}`)
            .then(() => window.location.reload());
    };

    return mocks ? <DumbMockList mocks={mocks} removeMock={removeMock}/> : <Spinner/>;
}
