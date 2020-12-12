import React, {useState, useEffect} from 'react';
import {Context} from "../../components/context/context";
import {MockCrudCard} from "../mock-crud-card/mock-crud-card";
import {useLocation} from 'react-router-dom';
import {client, sleep} from '../../utils';
import { Spinner } from '../../components/spinner/spinner';

/**
 * Mock creation or edition context (full-window dialog)
 * @param params.mock "Mock to be edited, undefined for creating a new one"
 */
export function MockCrudCtx({ onClose, mock: simpleMock }) {
    const location = useLocation();
    const isEdition = !!simpleMock;
    const [mock, setMock] = useState(null);

    useEffect(() => {
        if(!isEdition) {
            return;
        }

        client.get(`/mocks/${simpleMock.id}`)
            .then(async ({ data }) => {
                await sleep(2000);
                setMock(data);
            });
    }, [isEdition, simpleMock]);

    // Show new mock on right URL or always show for edition
    const isShown = location.pathname === '/new-mock' || isEdition;

    return (
    <Context onClose={onClose} title={isEdition ? simpleMock.name : "New mock"} isShown={isShown}>
        {isEdition ?
            mock ? <MockCrudCard mock={mock}/> : <Spinner/>
        :   <MockCrudCard/>}
    </Context>
    );
}
