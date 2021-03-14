import React from 'react';
import { DrawerView } from "./styles";

export function Drawer({ children }) {
    return (
        <DrawerView>
            <ul>{ children }</ul>
        </DrawerView>
    );
}
