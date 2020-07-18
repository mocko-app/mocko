import React from 'react';
import {Context} from "../../components/context/context";
import {NewMockCard} from "../new-mock-card/new-mock-card";

export function NewMockCtx() {
    return (
    <Context title="New mock">
        <NewMockCard/>
    </Context>
    );
}
