import React, {useRef} from 'react';
import {Portal} from "../../layouts/portal/portal";
import { useClickOutside } from "../../hooks/useClickOutside";
import { Description, ItemView, MenuView, Title } from './styles';

export function MenuItem({ title, description, separator, icon, onClick }) {
    return (
        <ItemView onClick={onClick} separator={separator}>
            { icon }
            <Title>{ title }</Title><br/>
            {description && <Description>{ description }</Description>}
        </ItemView>
    );
}

export function Menu({ children, x, y, onClose }) {
    const ref = useRef();
    useClickOutside(ref, onClose);

    return (
        <Portal>
            <MenuView ref={ref} style={{
                top: y + 'px',
                left: x + 'px',
            }}>
                { children }
            </MenuView>
        </Portal>
    );
}
