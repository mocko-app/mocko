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
    box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
                0 1px 1px  0   rgba(0, 0, 0, 0.14),
                0 1px 3px  0   rgba(0, 0, 0, 0.12);
`;

export const ListItemText = styled.div`
    display: inline-block;
    color: #FFF;
    width: 100%;
    vertical-align: middle;
`;
