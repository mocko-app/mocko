import React from 'react';
import { Route, Switch, Redirect } from "react-router-dom";
import {MockPage} from "../../pages/mock-page/mock-page";
import {FlagPage} from '../../pages/flag-page/flag-page';

export function Routes() {
    return (
        <Switch>
            <Route path="/mocks" component={MockPage}/>
            <Route path="/flags" component={FlagPage}/>

            <Redirect from="/" to="/mocks"/>
        </Switch>
    );
}
