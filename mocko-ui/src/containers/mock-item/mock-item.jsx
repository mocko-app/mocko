import React from "react";
import {Badge} from "../../components/badge/badge";
import {Icon} from "../../components/icon/icon";
import {ListItem} from "../../components/list/item";

export function MockItem({ name, method, path, onRemove }) {
    const deleteBtn = (
        <Icon onClick={ onRemove }>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM8 9H16V19H8V9ZM15.5 4L14.5 3H9.5L8.5 4H5V6H19V4H15.5Z" fill="white"/>
            </svg>
        </Icon>
    );
    return (
        <ListItem
            title={<>{name} <Badge color="green">{ method }</Badge></>}
            description={path}
            button={deleteBtn}/>
    );
}
