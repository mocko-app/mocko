import React, {useState} from 'react';
import {List} from "../../components/list/list";
import {MockItem} from "../mock-item/mock-item";
import {Spinner} from "../../components/spinner/spinner";

export function DumbMockList({ mocks, removeMock }) {
    return (
        <List>
            {mocks.map(mock =>
                <MockItem key={mock.id} method={mock.path} path={mock.path} onRemove={() => removeMock(mock.id)}/>)}
        </List>
    );
}

export function MockList() {
    const [mocks, setMocks] = useState(null);

    const removeMock = id => {

    };

    return mocks ? <DumbMockList mocks={mocks} removeMock={removeMock}/> : <Spinner/>;
}
