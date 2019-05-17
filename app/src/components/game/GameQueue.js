import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Loading from '../shared/Loading';
import { startGame } from '../../utils/socket';
import './styles/gamequeue.css';

class GameQueue extends Component {
  componentDidMount() {
    // Add listeners for queue
  }

  componentWillUnmount() {
    // Remove listeners for queue
  }

  render() {
    const { roomId, playerCount } = this.props;

    return (
      <section className="queue">
        <Loading message={`${playerCount}/4 players joined`} />
        <div className="queue__options">
          <p className="queue__invite">
            {`${window.location.host}/game/${roomId}`}
          </p>

          <button
            type="button"
            className="btn btn-med btn-start"
            onClick={startGame}
          >
            Start Game
          </button>
        </div>
      </section>
    );
  }
}

GameQueue.propTypes = {
  roomId: PropTypes.string.isRequired
};

export default GameQueue;
