import styled from "styled-components";

export const NewMockButtonView = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #1A1A1A;
    width: calc(100% - 4rem);
    max-width: 42rem;
    height: 3.5rem;
    margin: 0 auto;
    border-radius: var(--radius);
    cursor: pointer;
    transition: 0.2s all cubic-bezier(0.4, 0.0, 0.2, 1);
    overflow: hidden;
    
    :hover {
        background-color: #222;
        box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
                    0 1px 1px  0   rgba(0, 0, 0, 0.14),
                    0 1px 3px  0   rgba(0, 0, 0, 0.12);
    }

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transition: 0.4s all cubic-bezier(0.4, 0.0, 0.2, 1);
    }

    &:active::before {
        background-color: rgba(255, 255, 255, 0.08);
    }
`;
