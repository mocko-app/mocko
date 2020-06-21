import styled from 'styled-components';

export const Split = styled.div`
    position: relative;
    width: 100%;
`;

export const Column = styled.div`
    position: relative;
    display: inline-block;
    vertical-align: top;
    width: calc(50% - 0.5rem);

    & ~ div {
        margin-left: 1rem;
    }
`;
