import React, { Component } from 'react';
import {} from '../../utils/socket';
import './styles/gameboard.css';

class GameBoard extends Component {
  state = {};

  render() {
    return (
      <section className="game">
        <div className="game__top">
          <div className="game__info">info</div>
          <div className="game__player game__player-top">p2</div>
        </div>

        <div className="game__middle">
          <div className="game__player game__player-left">p1</div>

          <div className="game__board">game board</div>
          <div className="game__player game__player-right">p3</div>
        </div>

        <div className="game__bottom">
          <div className="game__player game__player-bottom">p4</div>
        </div>
      </section>
    );
  }
}

export default GameBoard;
