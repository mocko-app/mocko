import React, {useEffect} from 'react';
import {AppView, Logo} from "./styles";
import {Navbar} from "../../components/navbar/navbar";
import {Mocks, useMocks} from "../../contexts/mock";
import {BrowserRouter} from "react-router-dom";
import {MockCrudCtx} from "../mock-crud-ctx/mock-crud-ctx";
import { AppDrawer } from './drawer';
import { Routes } from './routes';

export function App() {
    const mocks = useMocks();

    useEffect(() => {
        document.querySelector(".loader").classList.add("loader_hidden");
        setTimeout(() => document.body.removeChild(document.querySelector(".loader")), 200);
    }, []);

    return (
        <Mocks.Provider value={mocks}>
            <BrowserRouter>
                <Navbar>
                    <Logo src="https://cdn.codetunnel.net/mocko/logo-white.svg" alt="Mocko Logo"/>
                    Mocko
                </Navbar>
                <AppDrawer/>
                <AppView id="page">
                    <Routes/>
                </AppView>

                <MockCrudCtx/>
            </BrowserRouter>
        </Mocks.Provider>
    );
}
