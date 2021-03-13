import styled from 'styled-components';

export const ListView = styled.ul`
    text-align: left;
`;

export const ListItemView = styled.li`
    position: relative;
    width: calc(100% - 4rem);
    max-width: 42rem;
    padding: 1rem;
    margin: 0 auto;
    margin-bottom: 0.5rem;
    overflow: hidden;
    border-radius: var(--radius);
    background-color: #111;
    cursor: pointer;
    transition: 0.4s background-color cubic-bezier(0.4, 0.0, 0.2, 1);

    &:hover {
        background-color: #151515;
    }

    &:active {
        background-color: #222;
    }
`;

export const ListItemContent = styled.div`
    display: inline-block;
    vertical-align: middle;
`;

export const ListItemTitle = styled.span`
    font-family: Roboto, Arial, sans-serif;
    font-size: 1.25rem;
    color: #FFF;
    width: 100%;
`;

export const ListItemText = styled.span`
    color: #FFF;
    opacity: 0.64;
    width: 100%;
`;
