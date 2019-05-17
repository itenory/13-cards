import React from 'react';
import PropTypes from 'prop-types';
import './styles/rules.css';

const Rules = ({ closeRules }) => (
  <section className="rules">
    <header className="rules__header">
      <h2 className="rules__title">Tien Len Game Rules</h2>
      <button
        type="button"
        className="btn btn-med btn-close btn-top-right"
        onClick={closeRules}
      >
        X
      </button>
    </header>

    <section className="rules__scrollable">
      <section className="rules__section">
        <h4 className="rules__heading">Card Ranking</h4>
        <p className="rules__description">
          The ranking of the cards from highest to lowest is: 2 A K Q J 10 9 8 7
          6 5 4 3. Same value cards are then ranked by their suit from highest
          to lowest is: Hearts ♥, Diamonds ♦, Clubs ♣, Spades ♠.
        </p>
      </section>

      <section className="rules__section">
        <h4 className="rules__heading">Combination</h4>
        <div className="rules__description">
          <ul className="rules__list">
            <li>
              Single - A single card. This form can be defeated by playing a
              card of higher rank.
            </li>
            <li>
              Pairs - A pair of the same card values (different suits). This
              form can be defeated by playing a pair of higher rank.
            </li>
            <li>
              Triple - Three of the same card values (different suits). This
              form can be defeated by playing a triplet of higher rank.
            </li>
            <li>
              Run - Three or more cards in numerical sequence. This form can be
              defeated by playing a run of the same length of cards that ends in
              a higher rank.
            </li>
            <li>
              4 of a kind - All four copies of a card (all suits). This is the
              highest ranked combination and can be used to beat any of the
              other combinations.
            </li>
          </ul>
        </div>
      </section>

      <section className="rules__section">
        <h4 className="rules__heading">Game Play</h4>
        <div className="rules__description">
          <ul className="rules__list">
            <li className="rules__item">
              First card must be 3♠ or the lowest card
            </li>
            <li className="rules__item">
              Each turn, a player can play or pass their turn. When playing, the
              combination must be higher than the last one played.
            </li>
            <li className="rules__item">
              {' '}
              When all players pass their turn, the last player to play can play
              any combination of cards they want.
            </li>
            <li className="rules__item">
              The game is won by the player who plays all cards in their hand.
            </li>
          </ul>
        </div>
      </section>
    </section>
  </section>
);

Rules.propTypes = {
  closeRules: PropTypes.func.isRequired
};

export default Rules;
