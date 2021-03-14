import styled from 'styled-components';
import {NavLink} from "react-router-dom";

export const Drawer = styled.div`
    position: fixed;
    top: 4rem;
    left: 0;
    height: calc(100% - 4rem);
    width: 14rem;
    padding: 1rem 0;
    color: #FFF;
    background-color: #030303;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 100;
`;

const DRAWER_ITEM_STYLE = `
    position: relative;
    display: block;
    height: 2.25rem;
    line-height: 2.25rem;
    padding-left: 3rem;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.7);
    transition: 0.2s background-color cubic-bezier(0.4, 0.0, 0.2, 1);

    &:hover {
        background-color: #111;
    }

    &:active {
        background-color: #222;
    }

    svg {
        position: absolute;
        top: 0.375rem;
        left: 1rem;
        width: 1.5rem;
        height: 1.5rem;
        opacity: 0.6;
    }

    &.active {
        display: block !important;
        background-color: #222;
        color: rgba(255, 255, 255, 1);

        svg {
            opacity: 1;
        }
    }
`;

export const DrawerItem = styled(NavLink)`
    ${DRAWER_ITEM_STYLE}

    ${({ hidden }) => hidden ? 'display: none;' : ''}
`;
export const DrawerItemAnchor = styled.a`${DRAWER_ITEM_STYLE}`;

export const DrawerSeparator = styled.hr`
    opacity: 0.1;
    margin: 0.5rem 0;
`;
