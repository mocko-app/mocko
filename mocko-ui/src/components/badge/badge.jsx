import React from 'react';
import { BadgeView } from './styles';

export function Badge({ children, color }) {
    return <BadgeView color={color || ""}>{ children }</BadgeView>;
}
