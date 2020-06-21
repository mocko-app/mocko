import React from 'react';

export function Spinner() {
    return (
        <svg className="loader__spinner" width="2rem" height="2rem" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
            <circle className="loader__ball" fill="none" strokeWidth="4" strokeLinecap="round" cx="33" cy="33" r="30"/>
        </svg>
    );
}
