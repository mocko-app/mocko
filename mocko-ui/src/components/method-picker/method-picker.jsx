import React from 'react';
import {Select} from "./styles";

export function MethodPicker({ method, onChange }) {
    return (
        <Select value={ method } onChange={ onChange }>
            <option>GET</option>
            <option>PUT</option>
            <option>POST</option>
            <option>PATCH</option>
            <option>DELETE</option>
        </Select>
    );
}
