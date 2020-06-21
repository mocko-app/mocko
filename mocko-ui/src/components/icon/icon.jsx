import React from 'react';
import {IconView} from "./styles";

export function Icon({ children, onClick }) {
    return <IconView onClick={ onClick }>{ children }</IconView>;
}
