import React from 'react';
import {ListItemText, ListItemView} from './styles';

export function ListItem({ children, onClick }) {
    return (
        <ListItemView onClick={ onClick }>
            <ListItemText>{ children }</ListItemText>
        </ListItemView>
    );
}
