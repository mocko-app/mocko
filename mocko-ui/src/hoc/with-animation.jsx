import React, { useState, useEffect } from 'react';

export const HIDDEN  = 'HIDDEN';
export const HIDING  = 'HIDING';
export const SHOWING = 'SHOWING';
export const SHOWN   = 'SHOWN';

export const withAnimation = (duration, durationOut, ignoreWhenHidden) => Child => props => {
    const [visibility, setVisibility] = useState(HIDDEN);

    useEffect(() => {
        if(props.isShown && visibility === HIDDEN) {
            setVisibility(SHOWING);
            setTimeout(() => setVisibility(SHOWN), duration);
        }

        if(!props.isShown && visibility === SHOWN) {
            setVisibility(HIDING);
            setTimeout(() => setVisibility(HIDDEN), durationOut || duration);
        }
    }, [props.isShown, visibility]);

    if(ignoreWhenHidden && visibility === HIDDEN)
        return null;

    return <Child {...props} visibility={ visibility } />;
};
