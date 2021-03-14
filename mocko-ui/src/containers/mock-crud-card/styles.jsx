import styled from "styled-components";
import {Input} from "../../components/input/styles";

const ERROR_BORDER = ({isError}) => isError ? `
border: 1px solid #f44336;
`:'';

export const StatusInput = styled(Input)`
    display: block;
    margin-top: 0.5rem;
    margin-bottom: 1rem;
    width: 6rem;

    ${ERROR_BORDER}
`;

export const PathInput = styled(Input)`
    width: calc(100% - 7rem);

    ${ERROR_BORDER}
`;

export const NameInput = styled(Input)`
    display: block;
    margin-top: 0.5rem;
    margin-bottom: 1rem;

    ${ERROR_BORDER}
`;

export const FieldError = styled.span`
    display: block;
    color: #f44336;
    margin-top: -0.5rem;
    margin-bottom: 1rem;
`;
