import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './home/HomePage';
import GamePage from './game/GamePage';
import NotFoundPage from './NotFoundPage';

const Root = () => (
  <Router>
    <MainLayout>
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route path="/game/:roomId" component={GamePage} />
        <Route component={NotFoundPage} />
      </Switch>
    </MainLayout>
  </Router>
);

export default Root;
