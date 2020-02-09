import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import BinanceApp from './BinanceApp';
import * as serviceWorker from './serviceWorker';
// import { Router, Route, Link } from 'react-router'
import {Route, BrowserRouter as Router} from 'react-router-dom'

ReactDOM.render((<Router>
  {/* <Route path="/" component={(props) => <div>{props.children}</div>}> */}
    <Route path="/u" component={App}/>
    <Route path="/b/u" component={BinanceApp}/>
  {/* </Route> */}
</Router>), document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
