import React from 'react';
import { ButtonView } from "./styles";

export function Button({ type, ...props }) {
    const viewProps = {
        ...props,
        type: type || 'submit',
    };

    return <ButtonView {...viewProps} />;
}
