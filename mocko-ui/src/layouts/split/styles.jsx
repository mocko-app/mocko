import styled from 'styled-components';

export const Split = styled.div`
    position: relative;
    width: 100%;
`;

export const Column = styled.div`
    position: relative;
    display: inline-block;
    vertical-align: top;
    width: calc(${({width}) => width || '50'}% - 0.5rem);
    margin-bottom: 1rem;

    & ~ div {
        margin-left: 1rem;
    }
`;
