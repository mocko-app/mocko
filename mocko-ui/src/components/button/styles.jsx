import styled from 'styled-components';

export const ButtonView = styled.button`
	display: inline-block;
	position: relative;
	border: none;
	outline: none;
	padding: 0 1rem;
	height: 2.25rem;
	min-width: 4rem;
	line-height: 2.25rem;
	border-radius: var(--radius);

    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    letter-spacing: 0.02rem;

	cursor: pointer;
	overflow: hidden;
	color: #000;
	background-color: #FFF;
    transition: 0.4s all cubic-bezier(0.4, 0.0, 0.2, 1);

    ${({ isTransparent }) => isTransparent ? `
        color: #00c853;
        background-color: rgba(0, 0, 0, 0);
        box-shadow: none !important;
        padding: 0 0.5rem;
        margin: 0 -0.5rem;

        &::before {
            display: none;
        }

        &:hover, &:focus {
            background-color: rgba(76, 175, 80, 0.08);
        }

        &:active {
            background-color: rgba(76, 175, 80, 0.32);
        }
    `: ''}
`;
