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
	address payable[] private s_players;
	uint private immutable i_ticketPrice;
	LotteryState private s_lotteryState;

	////////////////////
	// * Events 	  //
	////////////////////
	event LotteryEnter(address indexed player);

	////////////////////
	// * Modifiers 	  //
	////////////////////

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

		if (s_players.length == 3) {
			pickWinner();
		}
		emit LotteryEnter(msg.sender);
	}

	////////////////////
	// * Internal 	  //
	////////////////////
	function pickWinner() internal {
		s_lotteryState = LotteryState.CLOSED;
		payable(msg.sender).transfer(address(this).balance);
	}

	////////////////////
	// * Private 	  //
	////////////////////

	////////////////////
	// * View & Pure  //
	////////////////////
}
