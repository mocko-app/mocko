import React from 'react';
import styled from 'styled-components';

const FileView = styled.li`
    position: relative;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    height: 2.25rem;
    line-height: 2.25rem;
    padding-left: 2.5rem;
    padding-right: 0.5rem;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.7);
    border-bottom: 1px solid #1E1E1E;
    background-color: #030303;
    font-size: 0.875rem;
    transition: 0.2s background-color cubic-bezier(0.4, 0.0, 0.2, 1);
    text-align: left;

    &:hover {
        background-color: #111;
    }

    &:active {
        background-color: #222;
    }

    &:last-child {
        border-bottom: none;
    }

    svg {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        width: 1.25rem;
        height: 1.25rem;
        opacity: 0.6;
    }

    ${({isActive}) => isActive ? `
        position: sticky;
        bottom: 0;
        top: 0;
        color: rgba(255, 255, 255, 1);
        border-top: 1px solid #474747;
        border-bottom: 1px solid #474747 !important;
        svg { opacity: 1; }
        z-index: 1;
    `:''}
`;

export function File({ id, name, icon }) {
    return null;
}

export function FolderFile({ isActive, onClick, name, icon }) {
    return (
        <FileView isActive={isActive} onClick={onClick}>
            {icon}
            {name}
        </FileView>
    );
}
