import React, {useEffect} from 'react';
import {AppView} from "./styles";
import {Navbar} from "../../components/navbar/navbar";
import {NewMockCard} from "../new-mock-card/new-mock-card";
import {MockList} from "../mock-list/mock-list";
import {Mocks, useMocks} from "../../contexts/mock";

export function App() {
    const mocks = useMocks();

    useEffect(() => {
        document.querySelector(".loader").classList.add("loader_hidden");
        setTimeout(() => document.body.removeChild(document.querySelector(".loader")), 200);
    }, []);

    return (
        <Mocks.Provider value={mocks}>
            <AppView>
                <Navbar>Mocko</Navbar>
                <MockList/>
                <NewMockCard/>
            </AppView>
        </Mocks.Provider>
    );
}
