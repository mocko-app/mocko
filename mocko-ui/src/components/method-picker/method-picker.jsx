import React from 'react';
import {Select} from "./styles";

export function MethodPicker({ value, onChange }) {
    return (
        <Select value={ value } onChange={ onChange }>
            <option>GET</option>
            <option>PUT</option>
            <option>POST</option>
            <option>PATCH</option>
            <option>DELETE</option>
        </Select>
    );
}
