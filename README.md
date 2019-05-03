# 13-cards (Tiến lên)
A card game called 13 cards, or Tien len, built with React and Node. Application use socket.io for communication between clients playing games. Redis is used to store and play out game states in memeory. 

### To run locally
Requirements
* redis version 5+
* node version 10+
* mongodb

To run locally, run install in root, server, and app directories. Then use the command start
 ``` 
 npm run start
 ```



#### Game Rules
There are many variation to the game so below are the rules used for this version. Game starts
  with each player being dealt 13 cards.
  
###### Card Ranking
The ranking of the cards from highest to lowest is: 2 A K Q J 10 9 8 7 6 5 4 3. 
Same value cards are then ranked by their suit from highest to lowest is: Hearts ♥, Diamonds ♦, Clubs ♣, Spades ♠.
  
###### Combinations
  Players can choose to play cards in any of the following combinations:
  * Single - A single card. This form can be defeated by playing a card of higher rank.
  * Pairs - A pair of the same card values (different suits). This form can be defeated by playing a pair of higher rank.
  * Triple - Three of the same card values (different suits). This form can be defeated by playing a triplet of higher rank.
  * Run - Three or more cards in numerical sequence. This form can be defeated by playing a run of the same length of cards that ends in a higher rank.
  * 4 of a kind - All four copies of a card (all suits). This is the highest ranked combination and can be used to beat any of the other combinations.
  
###### Play
  * First card must be 3♠ or the lowest card
  * Each turn, a player can play or pass their turn. When playing, the combination must be higher than the last one played.
  * When all players pass their turn, the last player to play can play any combination of cards they want.
  * The game is won by the player who plays all cards in their hand.


### Task to complete
- [x] Update README
    - [X] Rules and How to Play
    - [X] How to start app
    - [X] Requirements
- [ ] Front-end game play
- [ ] Back-end game play
