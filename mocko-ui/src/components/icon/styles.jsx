import styled from "styled-components";

export const IconView = styled.button`
    background-color: rgba(255, 255, 255, 0);
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 2.5rem;
    height: 2.5rem;
    border: none;
    outline: none;
    cursor: pointer;
    border-radius: 50%;
    transition: all 200ms cubic-bezier(0.4, 0.0, 0.2, 1);
    
    &:hover {
        background-color: rgba(255, 255, 255, 0.08);
    }
    
    &:active {
        background-color: rgba(255, 255, 255, 0.24);
    }
`;
