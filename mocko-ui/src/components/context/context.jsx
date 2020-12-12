import React from 'react';
import {Portal} from "../../layouts/portal/portal";
import {Backdrop, CtxIcon, CtxNavbar} from "./styles";
import {Link} from "react-router-dom";
import {withAnimation} from "../../hoc/with-animation";

function BaseContext({ title, children, visibility }) {
    return (
    <Portal>
        <CtxNavbar visibility={ visibility }>
            <Link to="/">
                <CtxIcon margin="0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="white"/>
                    </svg>
                </CtxIcon>
            </Link>
            { title }
        </CtxNavbar>
        <Backdrop visibility={ visibility }>
            { children }
        </Backdrop>
    </Portal>
    );
}

export const Context = withAnimation(300, 150, true)(BaseContext);
