import styled from 'styled-components';

export const ListView = styled.ul`
    text-align: left;
`;

export const ListItemView = styled.li`
    position: relative;
    width: calc(100% - 4rem);
    max-width: 42rem;
    padding: 0.75rem;
    margin: 0 auto;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
    cursor: pointer;
    transition: 0.4s background-color cubic-bezier(0.4, 0.0, 0.2, 1);

    &:hover {
        background-color: #111;
    }

    &:active {
        background-color: #222;
    }

    &:last-child {
        border: none;
    }
`;

export const ListItemContent = styled.div`
    display: inline-block;
    vertical-align: middle;
`;

export const ListItemTitle = styled.span`
    font-family: Roboto, Arial, sans-serif;
    font-size: 1rem;
    line-height: 1rem;
    color: #FFF;
    width: 100%;
`;

export const ListItemText = styled.span`
    color: #FFF;
    font-size: 0.875rem;
    opacity: 0.7;
    width: 100%;
`;
