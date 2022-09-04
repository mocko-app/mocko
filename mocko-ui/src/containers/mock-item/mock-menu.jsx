import React from 'react';
import { Menu, MenuItem } from '../../components/menu/menu';

export function MockMenu({ x, y, isEnabled, onClose, onEdit, onDelete, onDisable, onEnable }) {
    return (
        <Menu onClose={onClose} x={x} y={y}>
            <MenuItem title="Edit" onClick={ onEdit } icon={
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="white" />
                </svg>
            }/>
            { isEnabled ?
            <MenuItem title="Disable" onClick={ onDisable } icon={
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="white"/>
                </svg>
            }/>
            :
            <MenuItem title="Enable" onClick={ onEnable } icon={
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5v14l11-7z" fill="white"/>
                </svg>
            }/> }
            <MenuItem title="Delete" onClick={ onDelete } icon={
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM8 9H16V19H8V9ZM15.5 4L14.5 3H9.5L8.5 4H5V6H19V4H15.5Z" fill="white"/>
                </svg>
            }/>
        </Menu>
    );
}
