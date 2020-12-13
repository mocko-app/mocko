
import React from 'react';
import styled from 'styled-components';

const WarningView = styled.div`
    position: relative;
    background-color: rgba(255, 145, 0, 0.12);
    padding: 1rem;
    padding-left: 3rem;
    border-radius: 0.25rem;
    margin-bottom: 1rem;
    text-align: left;
    svg {
        position: absolute;
        top: 1rem;
        left: 1rem;
    }
`;

const WarningTitle = styled.h1`
    font-size: 0.875rem;
    font-weight: 500;
    color: #FEF8E7;
`;

const WarningCode = styled.code`
    font-size: 0.75rem;
    font-weight: 400;
    font-family: "Roboto Mono", monospace;
    color: #FEF8E7;
    white-space: pre-line;
`;

export function Warning({ title, children }) {
    return (
        <WarningView>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="#FFCA28"/>
            </svg>
            <WarningTitle>{title}</WarningTitle>
            <br/>
            <WarningCode>{children}</WarningCode>
        </WarningView>
    );
}
