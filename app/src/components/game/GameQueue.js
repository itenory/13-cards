import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Loading from '../shared/Loading';
import './styles/gamequeue.css';

class GameQueue extends Component {
  /**
   * Add listeners for queue and send request to join game.
   */
  componentDidMount() {
    if (this.props.subscribeQueue(this.props.updateGameState)) {
      this.props.joinGame(this.props.roomId);
    } else {
      this.props.updateGameState({ matchError: 'Socket not connected. ' });
    }
  }

  /**
   * Remove listeners for queue
   */
  componentWillUnmount() {
    this.props.unsubscribeQueue();
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
            onClick={() => this.props.startGame(roomId)}
          >
            Start Game
          </button>
        </div>
      </section>
    );
  }
}

GameQueue.propTypes = {
  roomId: PropTypes.string.isRequired,
  playerCount: PropTypes.number.isRequired,
  subscribeQueue: PropTypes.func.isRequired,
  unsubscribeQueue: PropTypes.func.isRequired,
  updateGameState: PropTypes.func.isRequired
};

export default GameQueue;
