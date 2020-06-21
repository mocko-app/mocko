import React, {useEffect} from 'react';
import {AppView} from "./styles";
import {Navbar} from "../../components/navbar/navbar";
import {List} from "../../components/list/list";
import {MockItem} from "../mock-item/mock-item";

export function App() {
    useEffect(() => {
        document.querySelector(".loader").classList.add("loader_hidden");
        setTimeout(() => document.body.removeChild(document.querySelector(".loader")), 200);
    }, []);

    return (
        <AppView>
            <Navbar>Mocko</Navbar>
            <List>
                <MockItem method="GET" path="/cats/{name}"/>
                <MockItem method="POST" path="/cats"/>
            </List>
        </AppView>
    );
}
