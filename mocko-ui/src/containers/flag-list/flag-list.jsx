import React from 'react';
import { Button } from '../../components/button/button';
import { NoContent } from "../../components/no-content/no-content";

export function FlagList() {
    return (
        <NoContent>
            No flags found
            <br/>

            {/* eslint-disable-next-line */}
            <a href="https://mocko.dev/statefulness" target="_blank">
                <Button>Go to Docs</Button>
            </a>
        </NoContent>
    );
}
