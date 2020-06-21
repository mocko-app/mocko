import React from 'react';
import {RightView} from './styles';
import {SPACES} from '../../utils';

export function Right({ children, padding = 'none' }) {
    return <RightView padding={ SPACES[padding] }>{ children }</RightView>;
}
