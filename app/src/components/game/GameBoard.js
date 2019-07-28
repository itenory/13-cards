import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Loading from '../shared/Loading';
import Card from './Card';
import './styles/gameboard.css';

class GameBoard extends Component {
  componentDidMount() {
    this.props.subscribeRoom(this.props.updateGame);

    // If game state isn't loaded, get current game state
    if (!this.props.gameState) this.props.getGameState();
  }

  componentWillUnmount() {
    this.props.unsubscribeRoom();
  }

  render() {
    const { gameState } = this.props;

    if (!gameState) return <Loading message="Loading game" />;

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

GameBoard.propTypes = {
  updateGame: PropTypes.func.isRequired,
  subscribeRoom: PropTypes.func.isRequired,
  unsubscribeRoom: PropTypes.func.isRequired,
  playCards: PropTypes.func.isRequired,
  passTurn: PropTypes.func.isRequired,
  getGameState: PropTypes.func.isRequired,
  gameState: PropTypes.object.isRequired
};

export default GameBoard;
