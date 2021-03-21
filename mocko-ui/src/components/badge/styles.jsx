import styled from 'styled-components';

export const BadgeView = styled.span`
    display: inline-block;
    line-height: 1rem;
    font-size: 0.875rem;
    padding: 0.125rem 0.625rem;
    margin: 0 0.25rem;
    border-radius: 1rem;
    font-weight: 500;

    color: #fff;
    background-color:rgba(255, 255, 255, 0.2);

    ${({ color }) => color.toUpperCase() === "GREEN" ? `
        color: #ecfffd;
        background-color: rgba(76, 175, 80, 0.2);
    ` : ''}

    ${({ color }) => color.toUpperCase() === "YELLOW" ? `
        color: #ffd;
        background-color: rgba(255, 193, 7, 0.2);
    ` : ''}

    ${({ color }) => color.toUpperCase() === "RED" ? `
        color: #ffe1db;
        background-color: rgba(244, 67, 54, 0.2);
    ` : ''}
`;
