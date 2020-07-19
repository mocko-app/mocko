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

    font-size: 1rem;
    font-weight: 500;
    letter-spacing: 0.5px;

	cursor: pointer;
	overflow: hidden;
	color: #FFF;
	background-color: #2E7D32;
	/* box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
				0 2px 2px  0   rgba(0, 0, 0, 0.14),
				0 1px 5px  0   rgba(0, 0, 0, 0.12); */
    transition: 0.4s all cubic-bezier(0.4, 0.0, 0.2, 1);

    &:hover, &:active {
        /* box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
            0 8px 10px 1px rgba(0, 0, 0, 0.14),
            0 3px 14px 2px rgba(0, 0, 0, 0.12); */
        box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
                    0 2px 2px  0   rgba(0, 0, 0, 0.14),
                    0 1px 5px  0   rgba(0, 0, 0, 0.12);
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

    &:hover::before, &:focus::before {
        background-color: rgba(255, 255, 255, 0.08);
    }

    &:active::before {
        background-color: rgba(255, 255, 255, 0.32);
    }

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
