// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

////////////////////
// * Imports 	  //
////////////////////
// Uncomment this line to use console.log
// import "hardhat/console.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

contract Lottery is VRFConsumerBaseV2 {
	////////////////////
	// * Errors 	  //
	////////////////////
	error Lottery__NotEnoughETH();
	error Lottery__NotOpen();
	error Lottery__TransactionFailed();
	error Lottery__AlreadyFull();
	error Lottery__TransferFailed();

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

	// * Constants
	uint32 private constant NUM_WORDS = 1;
	uint16 private constant REQUEST_CONFIRMATIONS = 3;

	// * Immutable
	uint private immutable i_ticketPrice;
	VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
	bytes32 private immutable i_gasLane;
	uint64 private immutable i_subscriptionId;
	uint32 private immutable i_callbackGasLimit;

	// * Storage
	address payable[] private s_players;
	LotteryState private s_lotteryState;
	mapping(address player => bool startEarly) public s_startEarly;
	address private s_recentWinner;

	////////////////////
	// * Events 	  //
	////////////////////
	event LotteryEnter(address indexed player, uint indexed numOfPlayers);
	event PickingWinner(LotteryState indexed lotteryState);
	event WinnerPicked(address indexed winner);
	event RequestedNumber(uint indexed requestId);

	////////////////////
	// * Modifiers 	  //
	////////////////////
	modifier stateIsOpen() {
		if (s_lotteryState != LotteryState.OPEN) revert Lottery__NotOpen();
		_;
	}

	// TODO modifier -> can leave only if is already in players array

	////////////////////
	// * Functions	  //
	////////////////////

	////////////////////
	// * Constructor  //
	////////////////////
	constructor(
		address _vrfCoordinator,
		uint _ticketPrice,
		bytes32 _gasLane,
		uint64 _subscriptionId,
		uint32 _callbackGasLimit
	) VRFConsumerBaseV2(_vrfCoordinator) {
		i_ticketPrice = _ticketPrice;
		i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
		i_subscriptionId = _subscriptionId;
		i_callbackGasLimit = _callbackGasLimit;
		i_gasLane = _gasLane;
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

	function enterLottery() public payable stateIsOpen {
		if (msg.value < i_ticketPrice) revert Lottery__NotEnoughETH();
		// ! I think this should never hit, but just in case
		if (s_players.length > 3) revert Lottery__AlreadyFull();
		// TODO give money back if they pay more than ticket price

		s_players.push(payable(msg.sender));
		emit LotteryEnter(msg.sender, s_players.length);

		if (s_players.length == 3) {
			pickWinner();
		}
	}

	function leave() public stateIsOpen {
		// player can leave and get his money back if he doesnt want to wait for others anymore
	}

	function pickWinnerEarlier() internal {
		// only called if 2 players agree to start lottery earlier (not wait 3rd player, and play 1v1)
		// if both agree call pickWinner()
	}

	////////////////////
	// * Internal 	  //
	////////////////////
	function pickWinner() internal {
		s_lotteryState = LotteryState.CLOSED;
		emit PickingWinner(s_lotteryState);
		uint requestId = i_vrfCoordinator.requestRandomWords(
			i_gasLane,
			i_subscriptionId,
			REQUEST_CONFIRMATIONS,
			i_callbackGasLimit,
			NUM_WORDS
		);
		emit RequestedNumber(requestId);
	}

	// ! This function executes after requested number is created
	function fulfillRandomWords(
		uint, // requestId,
		uint[] memory randomWords
	) internal override {
		uint winnerIndex = randomWords[0] % s_players.length;
		address payable recentWinner = s_players[winnerIndex];
		s_recentWinner = recentWinner;
		s_lotteryState = LotteryState.OPEN;
		delete s_players;
		emit WinnerPicked(recentWinner);
		(bool success, ) = recentWinner.call{value: address(this).balance}("");
		if (!success) revert Lottery__TransferFailed();
	}

	////////////////////
	// * Private 	  //
	////////////////////

	////////////////////
	// * View & Pure  //
	////////////////////
}
