import React from 'react';
import { Badge } from '../../components/badge/badge';
import { Drawer, DrawerItem, DrawerSeparator, DrawerItemAnchor } from '../../components/drawer/styles';

export function AppDrawer() {
    return (
        <Drawer>
            <DrawerItem to="/mocks">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12L18 16L16.59 14.59L18.17 13H12.94C12.6 16.1 10.68 18.72 8 20.05C7.96 21.69 6.64 23 5 23C3.34 23 2 21.66 2 20C2 18.34 3.34 17 5 17C5.95 17 6.78 17.45 7.33 18.14C9.23 17.11 10.59 15.23 10.91 13H7.81C7.4 14.16 6.3 15 5 15C3.34 15 2 13.66 2 12C2 10.34 3.34 9 5 9C6.3 9 7.4 9.84 7.82 11H10.92C10.6 8.77 9.23 6.9 7.33 5.86C6.78 6.55 5.95 7 5 7C3.34 7 2 5.66 2 4C2 2.34 3.34 1 5 1C6.64 1 7.96 2.31 7.99 3.95C10.67 5.28 12.59 7.9 12.93 11H18.16L16.58 9.41L18 8L22 12Z" fill="white"/>
                </svg>
                Mocks
            </DrawerItem>
            <DrawerItem to="/flags">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.4 6L14 4H5V21H7V14H12.6L13 16H20V6H14.4Z" fill="white" fillOpacity="0.6"/>
                </svg>
                Flags <Badge color="GREEN">New</Badge>
            </DrawerItem>
            <DrawerSeparator/>
            <DrawerItemAnchor href="https://mocko.dev" target="_blank">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="white" fillOpacity="0.6"/>
                </svg>
                Documentation
            </DrawerItemAnchor>
            <DrawerItemAnchor href="https://github.com/gabriel-pinheiro/mocko" target="_blank">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 3C7.0275 3 3 7.12937 3 12.2276C3 16.3109 5.57625 19.7597 9.15375 20.9824C9.60375 21.0631 9.7725 20.7863 9.7725 20.5441C9.7725 20.3249 9.76125 19.5982 9.76125 18.8254C7.5 19.2522 6.915 18.2602 6.735 17.7412C6.63375 17.4759 6.195 16.6569 5.8125 16.4378C5.4975 16.2647 5.0475 15.838 5.80125 15.8264C6.51 15.8149 7.01625 16.4954 7.185 16.7723C7.995 18.1679 9.28875 17.7758 9.80625 17.5335C9.885 16.9337 10.1212 16.53 10.38 16.2993C8.3775 16.0687 6.285 15.2728 6.285 11.7432C6.285 10.7397 6.63375 9.9092 7.2075 9.26326C7.1175 9.03257 6.8025 8.08674 7.2975 6.81794C7.2975 6.81794 8.05125 6.57571 9.7725 7.76377C10.4925 7.55615 11.2575 7.45234 12.0225 7.45234C12.7875 7.45234 13.5525 7.55615 14.2725 7.76377C15.9938 6.56418 16.7475 6.81794 16.7475 6.81794C17.2425 8.08674 16.9275 9.03257 16.8375 9.26326C17.4113 9.9092 17.76 10.7282 17.76 11.7432C17.76 15.2843 15.6563 16.0687 13.6538 16.2993C13.98 16.5877 14.2613 17.1414 14.2613 18.0065C14.2613 19.2407 14.25 20.2326 14.25 20.5441C14.25 20.7863 14.4188 21.0746 14.8688 20.9824C18.4238 19.7597 21 16.2993 21 12.2276C21 7.12937 16.9725 3 12 3Z" fill="white" fillOpacity="0.6"/>
                </svg>
                GitHub
            </DrawerItemAnchor>
        </Drawer>
    );
}
