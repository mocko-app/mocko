import styled from 'styled-components';
import { Button } from '../button/button';

export const Title = styled.div`
    position: relative;
    width: calc(100% - 4rem);
    max-width: 42rem;
    height: 2.25rem;
    margin: auto;
    margin-bottom: 0.5rem;
`;

export const TitleText = styled.h1`
    position: absolute;
    left: 0.75rem;
    font-family: 'Passion One', Roboto, Arial, sans-serif;
    font-size: 1.68rem;
    font-weight: 300;
    line-height: 2.25rem;
    color: rgba(255, 255, 255, 0.87);
`;

export const TitleButton = styled(Button)`
    position: absolute;
    right: 0;
`;
