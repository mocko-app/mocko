import React, {useEffect} from 'react';
import {AppView} from "./styles";

export function App() {
    useEffect(() => {
        document.querySelector(".loader").classList.add("loader_hidden");
        setTimeout(() => document.body.removeChild(document.querySelector(".loader")), 200);
    }, []);

    return (
        <AppView/>
    );
}
