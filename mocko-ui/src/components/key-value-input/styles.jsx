import styled from "styled-components";
import {Icon} from "../icon/icon";

export const KeyValueView = styled.div`
    position: relative;
    margin-top: 0.5rem;
`;

export const Input = styled.input`
    width: calc(50% - 1.75rem);
    margin-right: 0.5rem;
    padding: 0.75rem;
    background-color: #2C2C2C;
    color: #FFF;
    border: none;
    outline: none;
    border-radius: var(--radius);
`;

export const KVIcon = styled(Icon)`
    margin: 0;
`;
