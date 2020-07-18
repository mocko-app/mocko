import styled from "styled-components";
import {NavbarView} from "../navbar/styles";
import {IconView} from "../icon/styles";
import {HIDING, SHOWING} from "../../hoc/with-animation";

export const CtxNavbar = styled(NavbarView)`
  background-color: #424242;
  padding-left: 4rem;
  transition: 500ms opacity cubic-bezier(0.4, 0.0, 0.2, 1);

  ${({visibility}) => [HIDING, SHOWING].includes(visibility) ? `
    opacity: 0;
    transition: 150ms opacity cubic-bezier(0.4, 0.0, 0.2, 1);
  ` : ''}
`;

export const CtxIcon = styled(IconView)`
    top: 0.25rem;
    left: 0.25rem;
`;

export const Backdrop = styled.aside`
    position: fixed;
    top: 4rem;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #151515;
    padding-top: 1rem;
    overflow: auto;
    transition: 300ms top cubic-bezier(0.0, 0.0, 0.2, 1);
    
    ${({visibility}) => [HIDING, SHOWING].includes(visibility) ? `
        top: 100%;
        transition: 150ms top cubic-bezier(0.4, 0.0, 1, 1);
    ` : ''}
`;
