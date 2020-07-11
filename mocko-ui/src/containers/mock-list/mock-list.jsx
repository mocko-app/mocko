import React, {useContext} from 'react';
import {List} from "../../components/list/list";
import {MockItem} from "../mock-item/mock-item";
import {Spinner} from "../../components/spinner/spinner";
import {Mocks} from "../../contexts/mock";

export function MockList() {
    const { mocks, isLoading, hasError, removeMock } = useContext(Mocks);

    if(isLoading) {
        return <Spinner/>;
    }
    if(hasError) {
        return "Oops! Failed to load mocks";
    }

    return (
        <List>
            {mocks.map(mock =>
                <MockItem key={mock.id} method={mock.method} path={mock.path} onRemove={() => removeMock(mock.id)}/>)}
        </List>
    );
}
