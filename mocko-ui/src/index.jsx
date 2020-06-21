import React from 'react';
import ReactDOM from 'react-dom';
import {App} from "./containers/app/app";

import './fonts.css';
import './index.css';

ReactDOM.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>,
    document.getElementById('root')
);
