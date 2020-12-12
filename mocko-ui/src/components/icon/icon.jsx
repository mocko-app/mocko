import React from "react";
import {IconView} from "./styles";
import {SPACES} from "../../utils";

export function Icon({ margin = "none", onClick, children }) {
    return <IconView margin={SPACES[margin]} onClick={onClick}>{ children }</IconView>;
}
