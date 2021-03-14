import React from 'react';
import { Route, Switch, Redirect } from "react-router-dom";
import { FlagList } from '../flag-list/flag-list';
import {MockList} from "../mock-list/mock-list";

export function Routes() {
    return (
        <Switch>
            <Route path="/mocks" component={MockList}/>
            <Route path="/flags" component={FlagList}/>

            <Redirect from="/" to="/mocks"/>
        </Switch>
    );
}
