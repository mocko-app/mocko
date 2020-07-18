import styled from "styled-components";
import {NavbarView} from "../navbar/styles";
import {IconView} from "../icon/styles";
import {AppView} from "../../containers/app/styles";

export const CtxNavbar = styled(NavbarView)`
  background-color: #323232;
  padding-left: 4rem;
`;

export const CtxIcon = styled(IconView)`
    top: 0.25rem;
    left: 0.25rem;
`;

export const Backdrop = AppView;
