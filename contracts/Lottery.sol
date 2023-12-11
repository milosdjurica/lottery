// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

////////////////////
// * Imports 	  //
////////////////////
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Lottery {
	////////////////////
	// * Errors 	  //
	////////////////////
	error Lottery__NotEnoughETH();
	error Lottery__NotOpen();
	error Lottery__TransactionFailed();

	////////////////////
	// * Types 		  //
	////////////////////
	enum LotteryState {
		OPEN,
		CLOSED
	}

	////////////////////
	// * Variables	  //
	////////////////////

	uint private immutable i_ticketPrice;

	LotteryState private s_lotteryState;
	address payable[] private s_players;
	mapping(address player => bool startEarly) public s_startEarly;

	////////////////////
	// * Events 	  //
	////////////////////
	event LotteryEnter(address indexed player);
	event PickingWinner(LotteryState indexed lotteryState);

	////////////////////
	// * Modifiers 	  //
	////////////////////
	// TODO modifier -> can leave only if is already in players array

	////////////////////
	// * Functions	  //
	////////////////////

	////////////////////
	// * Constructor  //
	////////////////////
	constructor(uint _ticketPrice) {
		i_ticketPrice = _ticketPrice;

		s_lotteryState = LotteryState.OPEN;
	}

	////////////////////////////
	// * Receive & Fallback   //
	////////////////////////////

	////////////////////
	// * External 	  //
	////////////////////

	////////////////////
	// * Public 	  //
	////////////////////

	function enterLottery() public payable {
		if (msg.value < i_ticketPrice) revert Lottery__NotEnoughETH();
		if (s_lotteryState != LotteryState.OPEN) revert Lottery__NotOpen();

		s_players.push(payable(msg.sender));
		emit LotteryEnter(msg.sender);

		if (s_players.length == 3) {
			pickWinner();
		}
	}

	function leave() public {}

	function pickWinnerEarlier() internal {
		// only called if 2 players agree to start lottery earlier (not wait 3rd player, and play 1v1)
	}

	////////////////////
	// * Internal 	  //
	////////////////////
	function pickWinner() internal {
		s_lotteryState = LotteryState.CLOSED;
		emit PickingWinner(s_lotteryState);
		payable(msg.sender).transfer(address(this).balance);
	}

	////////////////////
	// * Private 	  //
	////////////////////

	////////////////////
	// * View & Pure  //
	////////////////////
}
