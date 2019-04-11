import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import HomePage from './home/HomePage';

const Root = () => (
  <Router>
    <Switch>
      <Route exact path="/" component={HomePage} />
    </Switch>
  </Router>
);

export default Root;
