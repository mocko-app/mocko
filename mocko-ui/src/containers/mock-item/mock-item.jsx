import React, { useState } from "react";
import {Icon} from "../../components/icon/icon";
import {ListItem} from "../../components/list/item";
import { MockCrudCtx } from "../mock-crud-ctx/mock-crud-ctx";

export function MockItem(params) {
    const { name, method, path, onRemove } = params;
    const [isOpened, setOpened] = useState(false);

    const remove = e => {
        e.stopPropagation();
        onRemove();
    };

    const deleteBtn = (
        <Icon margin="s" onClick={ remove }>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM8 9H16V19H8V9ZM15.5 4L14.5 3H9.5L8.5 4H5V6H19V4H15.5Z" fill="white"/>
            </svg>
        </Icon>
    );
    return (
        <>
        <ListItem
            title={<>{name || 'Unnamed mock'}</>}
            description={`${method} ${path}`}
            onClick={() => setOpened(true)}
            button={deleteBtn}/>
        {isOpened && <MockCrudCtx onClose={() => setOpened(false)} mock={params}/>}
        </>
    );
}
