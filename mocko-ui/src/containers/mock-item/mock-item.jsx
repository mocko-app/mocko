import React, { useState } from "react";
import {Icon} from "../../components/icon/icon";
import {ListItem} from "../../components/list/item";
import { MockCrudCtx } from "../mock-crud-ctx/mock-crud-ctx";
import { MockMenu } from "./mock-menu";

export function MockItem(params) {
    const { name, method, path, onRemove } = params;
    const [isOpened, setOpened] = useState(false);
    const [menuPos, setMenuPos] = useState(null);

    const remove = e => {
        e.stopPropagation();
        onRemove();
    };

    const openMenu = e => {
        e.stopPropagation();
        setMenuPos([
            Math.floor(e.clientX),
            Math.floor(e.clientY)
        ]);
    };

    const closeMenu = e => {
        e.stopPropagation();
        setMenuPos(null);
    };

    const kebab = (
        <Icon margin="s" onClick={ openMenu }>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="white"/>
            </svg>
        </Icon>
    );
    return (
        <>
        <ListItem
            title={<>{name || 'Unnamed mock'}</>}
            description={`${method} ${path}`}
            onClick={() => setOpened(true)}
            button={kebab}/>
        {isOpened && <MockCrudCtx onClose={() => setOpened(false)} mock={params}/>}
        {menuPos && <MockMenu x={menuPos[0]} y={menuPos[1]}
            onClose={ closeMenu }
            onDelete={ remove }
            onDisable={ () => alert('Disable')} /> }
        </>
    );
}
