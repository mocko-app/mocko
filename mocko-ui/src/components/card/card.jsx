import React from 'react';
import {CardBar, CardBody, CardHeader, CardTitle, CardView} from "./styles";

export function Card({ title, children, isLoading, ...props }) {
    return (
        <CardView {...props}>
            {title &&
            <CardHeader>
                <CardTitle>{ title }</CardTitle>
                {isLoading && <CardBar />}
            </CardHeader> }
            <CardBody hasTitle={ Boolean(title) }>{ children }</CardBody>
        </CardView>
    );
}
