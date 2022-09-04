import React, { useContext, useState } from "react";
import {Icon} from "../../components/icon/icon";
import {ListItem} from "../../components/list/item";
import { Mocks } from "../../contexts/mock";
import { MockCrudCtx } from "../mock-crud-ctx/mock-crud-ctx";
import { MockMenu } from "./mock-menu";
import { Badge } from "../../components/badge/badge";

export function MockItem(params) {
    const { id, name, method, path, isEnabled } = params;
    const { removeMock, enableMock, disableMock } = useContext(Mocks);
    const [isOpened, setOpened] = useState(false);
    const [menuPos, setMenuPos] = useState(null);

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

    const openEdition = () => {
        setOpened(true);
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
            title={<>
                {name || 'Unnamed mock'}
                {!isEnabled && <Badge color="yellow">Disabled</Badge>}
            </>}
            description={`${method} ${path}`}
            onClick={ openEdition }
            button={kebab}/>
        {isOpened && <MockCrudCtx onClose={() => setOpened(false)} mock={params}/>}
        {menuPos && <MockMenu x={menuPos[0]} y={menuPos[1]}
            isEnabled={ isEnabled }
            onClose={ closeMenu }
            onEdit={ openEdition }
            onDelete={ () => removeMock(id) }
            onDisable={ () => disableMock(id) }
            onEnable={ () => enableMock(id) } /> }
        </>
    );
}
