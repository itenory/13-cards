import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { ajaxRequest } from '../../utils/utils';
import Notification from '../shared/Notification';
import Rules from '../shared/Rules';
import './styles/index.css';

class HomePage extends Component {
  state = {
    roomId: null, // Id of room once created
    rulesVisible: false, // Flag for rendering rules
    matchError: null
  };

  /**
   * Sends ajax request to create a room.
   */
  createRoom = () => {
    ajaxRequest('/create/room', 'post')
      .then(res => {
        // If a room id is sent back, redirect to room page
        if (res.data.roomId) {
          this.setState({ roomId: res.data.roomId });
        }
      })
      .catch(err => {
        this.setState({ matchError: err.response.data });
      });
  };

  toggleRules = () => this.setState({ rulesVisible: !this.state.rulesVisible });

  render() {
    const { roomId, matchError, rulesVisible } = this.state;
    if (roomId) return <Redirect to={`/game/${roomId}`} />;

    return (
      <section className="home">
        <h2 className="home__title">Tien Len (13 cards)</h2>

        {rulesVisible && <Rules closeRules={this.toggleRules} />}

        <div className="home__options">
          {matchError && (
            <Notification
              message={matchError}
              clearError={() => this.setState({ matchError: null })}
            />
          )}

          <button
            type="button"
            className="btn btn-lg btn-create"
            onClick={this.createRoom}
          >
            Create Room
          </button>

          <button
            type="button"
            className="btn btn-toggle"
            onClick={this.toggleRules}
          >
            Rules
          </button>
        </div>
      </section>
    );
  }
}

export default HomePage;
