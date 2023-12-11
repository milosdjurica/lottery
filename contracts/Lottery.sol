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
	address payable[] public s_players;
	uint private immutable i_ticketPrice;
	LotteryState s_lotteryState;

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
		emit LotteryEnter(msg.sender);
	}

	////////////////////
	// * Internal 	  //
	////////////////////

	////////////////////
	// * Private 	  //
	////////////////////

	////////////////////
	// * View & Pure  //
	////////////////////
}
