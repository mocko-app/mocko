import styled from "styled-components";

export const MenuView = styled.ul`
position: absolute;
padding: 0.5rem;
min-width: 10rem;
max-height: calc(100% - 5rem);
border-radius: var(--radius);
background-color: #111;
color: #FFF;
overflow-x: hidden;
overflow-y: auto;
z-index: 300;
transform: translateX(-100%);
box-shadow: 0px 3px  5px -1px rgba(0, 0, 0, 0.2),
            0px 6px 10px  0px rgba(0, 0, 0, 0.14),
            0px 1px 18px  0px rgba(0, 0, 0, 0.12);
`;

export const ItemView = styled.li`
max-width: 42rem;
padding: 0.5rem;
overflow: hidden;
cursor: pointer;
transition: 0.4s background-color cubic-bezier(0.4, 0.0, 0.2, 1);
border-radius: 0.25rem;

${({separator}) => separator ? `
    border-top: 1px solid rgba(255, 255, 255, 0.1);
`: ''}

&:hover {
    background-color: #171717;
}

&:active {
    background-color: #242424;
}

svg {
    display: inline;
    width: 1.5rem;
    height: 1.5rem;
    vertical-align: middle;
    margin-right: 0.5rem;
}
`;

export const Title = styled.span`
display: inline-block;
font-size: 1rem;
line-height: 1rem;
color: #FFF;
vertical-align: middle;
`;

export const Description = styled.span`
display: inline-block;
color: #FFF;
font-size: 0.875rem;
opacity: 0.7;
`;
