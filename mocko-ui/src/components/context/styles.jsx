import styled from "styled-components";
import {NavbarView} from "../navbar/styles";
import {IconView} from "../icon/styles";
import {HIDING, SHOWING} from "../../hoc/with-animation";

export const CtxNavbar = styled(NavbarView)`
  background-color: #151515;
  border: none;
  padding-left: 4rem;
  transition: 500ms opacity cubic-bezier(0.4, 0.0, 0.2, 1);

  ${({visibility}) => [HIDING, SHOWING].includes(visibility) ? `
    opacity: 0;
    transition: 150ms opacity cubic-bezier(0.4, 0.0, 0.2, 1);
  ` : ''}
`;

export const CtxIcon = styled(IconView)`
    top: 0.75rem;
    left: 0.75rem;
`;

export const Backdrop = styled.aside`
    position: fixed;
    top: 4rem;
    left: 0;
    width: 100%;
    height: calc(100% - 4rem);
    background-color: #030303;
    padding: 1rem 0;
    overflow: auto;
    transition: 300ms top cubic-bezier(0.0, 0.0, 0.2, 1);
    z-index: 150;

    ${({visibility}) => [HIDING, SHOWING].includes(visibility) ? `
        top: 100%;
        transition: 150ms top cubic-bezier(0.4, 0.0, 1, 1);
    ` : ''}
`;
