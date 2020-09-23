import React from 'react';
import {ListItemText, ListItemTitle, ListItemContent, ListItemView} from './styles';

export function ListItem({ title, description, button, onClick }) {
    return (
        <ListItemView onClick={ onClick }>
            <ListItemContent>
                <ListItemTitle>{ title }</ListItemTitle><br/>
                <ListItemText>{ description }</ListItemText>
            </ListItemContent>
            { button }
        </ListItemView>
    );
}
