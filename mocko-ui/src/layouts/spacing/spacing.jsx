import React from 'react';
import styled from 'styled-components';
import { decodeSpacing } from '../../utils';

export const SpacingView = styled.div`
    margin: ${({ margin }) => margin};
    padding: ${({ padding }) => padding};

    & > * {
        margin-bottom: ${({ componentSpacing }) => componentSpacing} !important;
    }

    & > *:last-child {
        margin-bottom: 0 !important;
    }
`;

function Spacing({ children, componentSpacing = 'none', margin = 'none', padding = 'none' }) {
    const spacing = { componentSpacing, margin, padding };
    const spacingCss = decodeSpacing(spacing);

    return <SpacingView {...spacingCss}>{ children }</SpacingView>;
}

export default Spacing;
