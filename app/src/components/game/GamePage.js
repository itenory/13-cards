import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { ajaxRequest } from '../../utils/utils';
import GameQueue from './GameQueue';
import GameBoard from './GameBoard';
import Loading from '../shared/Loading';
import {
  subscribeRoom,
  unsubscribeRoom,
  subscribeQueue,
  unsubscribeQueue,
  startGame,
  joinGame,
  getUserId,
  playCards,
  passTurn,
  getGameState
} from '../../utils/socket';

class GamePage extends Component {
  state = {
    roomId: this.props.match.params.roomId,
    matchStart: false,
    matchError: null,
    matchLoading: true,
    gameQueue: {},
    playerCount: 0,
    gameState: null
  };

  /**
   * On component mount, grab room data.
   */
  componentDidMount() {
    const { roomId } = this.state;

    if (roomId) {
      ajaxRequest(`/game/${roomId}/data`, 'get')
        .then(res => {
          if (!res.data.started) {
            return this.setState({
              matchStart: false,
              matchLoading: false
            });
          }

          if (res.data.players && res.data.players.indexOf(getUserId()) >= 0) {
            return this.setState({
              matchStart: true,
              matchLoading: false
            });
          }

          this.setState({
            matchError: 'Not correct user',
            matchLoading: false
          });
        })
        .catch(err => {
          this.setState({
            matchError: err.response.data,
            matchLoading: false
          });
        });
    }
  }

  /**
   * Updates game page state
   * @param {Object} state
   */
  updateGameState = state => {
    this.setState({
      gameState: {
        ...state
      }
    });
  };

  /**
   * Updates component state for game queue data.
   * @param {Object} state Data to speard into queue object
   */
  updateGameQueue = state => {
    this.setState({ ...state });
  };

  render() {
    const {
      roomId,
      matchStart,
      matchError,
      matchLoading,
      playerCount,
      gameState
    } = this.state;

    if (matchLoading) return <Loading message="Grabbing game data" />;

    if (!roomId || matchError) return <Redirect to="/" />;

    if (!matchStart) {
      return (
        <GameQueue
          roomId={roomId}
          playerCount={playerCount}
          updateGameState={this.updateGameQueue}
          joinGame={joinGame}
          startGame={startGame}
          subscribeQueue={subscribeQueue}
          unsubscribeQueue={unsubscribeQueue}
        />
      );
    }

    return (
      <GameBoard
        gameState={gameState}
        getGameState={() => getGameState(roomId)}
        updateGame={this.updateGameState}
        subscribeRoom={subscribeRoom}
        unsubscribeRoom={unsubscribeRoom}
        passTurn={passTurn}
        playCards={playCards}
      />
    );
  }
}

export default GamePage;
