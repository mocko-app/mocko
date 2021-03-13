import React, {useEffect} from 'react';
import {AppView, Logo} from "./styles";
import {Navbar} from "../../components/navbar/navbar";
import {MockList} from "../mock-list/mock-list";
import {Mocks, useMocks} from "../../contexts/mock";
import {BrowserRouter} from "react-router-dom";
import {MockCrudCtx} from "../mock-crud-ctx/mock-crud-ctx";

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
                    <Navbar>
                        <Logo src="http://cdn.codetunnel.net/mocko/logo-white.svg" alt="Mocko Logo"/>
                        Mocko
                    </Navbar>
                    <MockList/>
                </AppView>

                <MockCrudCtx/>
            </BrowserRouter>
        </Mocks.Provider>
    );
}
