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
    background-color: #222222;
    cursor: pointer;
    box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
                0 1px 1px  0   rgba(0, 0, 0, 0.14),
                0 1px 3px  0   rgba(0, 0, 0, 0.12);

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transition: 0.4s all cubic-bezier(0.4, 0.0, 0.2, 1);
    }

    &:hover::before, &:focus::before {
        background-color: rgba(255, 255, 255, 0.08);
    }

    &:active::before {
        background-color: rgba(255, 255, 255, 0.32);
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
