import React, {useEffect} from 'react';
import {AppView} from "./styles";
import {Navbar} from "../../components/navbar/navbar";
import {MockList} from "../mock-list/mock-list";
import {Mocks, useMocks} from "../../contexts/mock";
import {BrowserRouter} from "react-router-dom";
import Route from "react-router-dom/es/Route";
import {NewMockCtx} from "../new-mock-ctx/new-mock-ctx";

export function App() {
    const mocks = useMocks();

    useEffect(() => {
        document.querySelector(".loader").classList.add("loader_hidden");
        setTimeout(() => document.body.removeChild(document.querySelector(".loader")), 200);
    }, []);

    return (
        <Mocks.Provider value={mocks}>
            <BrowserRouter>
                <AppView>
                    <Navbar>Mocko</Navbar>
                    <MockList/>
                    <Route path="/new-mock">
                        <NewMockCtx/>
                    </Route>
                </AppView>
            </BrowserRouter>
        </Mocks.Provider>
    );
}
