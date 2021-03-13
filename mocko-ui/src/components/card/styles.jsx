import styled, { keyframes } from 'styled-components';

export const CardView = styled.article`
    position: relative;
    display: flex;
    flex-direction: column;
    width: calc(100% - 2rem);
    max-width: ${({ isSmall }) => isSmall ? '30rem' : '72rem'};
    margin: auto;
    padding-bottom: 1.5rem;

    border-radius: var(--radius);
    background-color: #222222;
    color: #FFF;
    overflow: hidden;
    z-index: 100;
	box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
				0 1px 1px  0   rgba(0, 0, 0, 0.14),
                0 1px 3px  0   rgba(0, 0, 0, 0.12);
`;

export const CardHeader = styled.header`
    position: relative;
    padding: 1.5rem;
    flex: 1;
`;

const firstBarAnimation = keyframes`
    0% {
        left: -35%;
        right:100%;
    }
    60% {
        left: 100%;
        right: -90%;
    }
    100% {
        left: 100%;
        right: -90%;
    }
`;

const secondBarAnimation = keyframes`
    0% {
        left: -200%;
        right: 100%;
    }
    60% {
        left: 107%;
        right: -8%;
    }
    100% {
        left: 107%;
        right: -8%;
    }
`;

export const CardBar = styled.div`
    position: absolute;
    bottom: 0.5rem;
    left: 0;
    right: 0;
    height: 0.125rem;

    &::before, &::after {
        content: '';
        background-color: #4CAF50;
        position: absolute;
        top: 0;
        height: 0.125rem;
    }

    &::before {
        animation: ${firstBarAnimation} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
    }

    &::after {
        animation: ${secondBarAnimation} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
        animation-delay: 1.15s;
    }
`;

export const CardTitle = styled.h1`
    font-family: 'Passion One', Roboto, Arial, sans-serif;
    font-size: 1.68rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.87);
`;

export const CardBody = styled.section`
    flex: 1;
    padding: 0 1.5rem;
    padding-top: ${({ hasTitle }) => hasTitle ? '0' : '1.5rem'};
    overflow-x: hidden;
    overflow-y: auto;
    color: rgba(255, 255, 255, 0.6);
    text-align: ${({ isSmall }) => isSmall ? 'center' : 'left'};
`;

export const CardText = styled.span`
    display: inline-block;
`;
