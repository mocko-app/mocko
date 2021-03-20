import React from 'react';
import { Route, Switch, Redirect } from "react-router-dom";
import {MockList} from "../mock-list/mock-list";
import {FlagPage} from '../flag-page/flag-page';

export function Routes() {
    return (
        <Switch>
            <Route path="/mocks" component={MockList}/>
            <Route path="/flags" component={FlagPage}/>

            <Redirect from="/" to="/mocks"/>
        </Switch>
    );
}
