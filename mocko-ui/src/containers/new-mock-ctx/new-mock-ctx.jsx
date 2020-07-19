import React from 'react';
import {Context} from "../../components/context/context";
import {NewMockCard} from "../new-mock-card/new-mock-card";
import {useLocation} from 'react-router-dom';

export function NewMockCtx() {
    const location = useLocation();

    return (
    <Context title="New mock" isShown={location.pathname === '/new-mock'}>
        <NewMockCard/>
    </Context>
    );
}
