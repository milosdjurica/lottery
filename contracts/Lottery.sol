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
	error Lottery__PlayerNotInArray(address player);

	////////////////////
	// * Types 		  //
	////////////////////
	enum LotteryState {
		OPEN,
		CLOSED
	}

	enum WantToStartEarly {
		NONE,
		NO,
		YES
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
	uint private immutable i_maxNumOfPlayers;

	// * Storage
	address payable[] private s_players;
	LotteryState private s_lotteryState;
	mapping(address player => WantToStartEarly startEarly)
		public s_playersAgreeToPickEarlier;
	address private s_recentWinner;

	////////////////////
	// * Events 	  //
	////////////////////
	event LotteryEnter(address indexed player, uint indexed numOfPlayers);
	event PickingWinner(LotteryState indexed lotteryState);
	event WinnerPicked(address indexed winner);
	event RequestedNumber(uint indexed requestId);
	event PlayerLeft(address indexed player, uint indexed numPlayersLeft);

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
		uint32 _callbackGasLimit,
		uint _maxNumOfPlayers
	) VRFConsumerBaseV2(_vrfCoordinator) {
		i_ticketPrice = _ticketPrice;
		i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
		i_subscriptionId = _subscriptionId;
		i_callbackGasLimit = _callbackGasLimit;
		i_gasLane = _gasLane;
		s_lotteryState = LotteryState.OPEN;
		i_maxNumOfPlayers = _maxNumOfPlayers;
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
		// ! I think this should never hit, but just in case
		if (s_players.length >= i_maxNumOfPlayers)
			revert Lottery__AlreadyFull();
		if (msg.value < i_ticketPrice) revert Lottery__NotEnoughETH();
		// give money back if they pay more than ticket price
		if (msg.value > i_ticketPrice) {
			payable(msg.sender).transfer(msg.value - i_ticketPrice);
		}
		s_players.push(payable(msg.sender));
		s_playersAgreeToPickEarlier[msg.sender] = WantToStartEarly.NO;
		emit LotteryEnter(msg.sender, s_players.length);

		if (s_players.length == i_maxNumOfPlayers) {
			pickWinner();
		}
	}

	function leave() public stateIsOpen {
		// ! Closing so last player cant enter while someone is leaving
		// ! (it would trigger picking winner earlier)
		s_lotteryState = LotteryState.CLOSED;

		uint indexToRemove = type(uint).max;
		uint playersLength = s_players.length;

		for (uint i = 0; i < playersLength; i++) {
			if (s_players[i] == msg.sender) {
				indexToRemove = i;
				break;
			}
		}

		if (indexToRemove > playersLength)
			revert Lottery__PlayerNotInArray(msg.sender);

		// ! Put last acc in place of acc that should be removed and pop() duplicate
		s_players[indexToRemove] = s_players[playersLength - 1];
		s_players.pop();
		emit PlayerLeft(msg.sender, playersLength - 1);
		// Have to put it back to NONE so he cant call pick early when he is not in lottery
		s_playersAgreeToPickEarlier[msg.sender] = WantToStartEarly.NONE;
		s_lotteryState = LotteryState.OPEN;
	}

	function pickWinnerEarlier() external stateIsOpen {
		s_lotteryState = LotteryState.CLOSED;
		if (s_playersAgreeToPickEarlier[msg.sender] == WantToStartEarly.NONE)
			revert Lottery__PlayerNotInArray(msg.sender);
		s_playersAgreeToPickEarlier[msg.sender] = WantToStartEarly.YES;
		if (allPlayersAgreeToStartEarly()) pickWinner();
		// TODO maybe emit if players dont wanna start
		s_lotteryState = LotteryState.OPEN;
	}

	////////////////////
	// * Internal 	  //
	////////////////////

	function allPlayersAgreeToStartEarly() internal view returns (bool) {
		uint playersLength = s_players.length;
		for (uint i = 0; i < playersLength; i++) {
			if (
				s_playersAgreeToPickEarlier[s_players[i]] !=
				WantToStartEarly.YES
			) return false;
		}
		return true;
	}

	function pickWinner() internal {
		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		// TODO Should return WantToStartEearly back to NONE because players arent active anymore
		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
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
		s_lotteryState = LotteryState.OPEN;
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
	function getTicketPrice() public view returns (uint) {
		return i_ticketPrice;
	}

	function getVrfCoordinator()
		public
		view
		returns (VRFCoordinatorV2Interface)
	{
		return i_vrfCoordinator;
	}

	function getLotteryState() public view returns (LotteryState) {
		return s_lotteryState;
	}

	function getMaxNumOfPlayers() public view returns (uint) {
		return i_maxNumOfPlayers;
	}

	function getNumOfActivePlayers() public view returns (uint) {
		return s_players.length;
	}

	function getPlayer(uint index) public view returns (address) {
		return s_players[index];
	}

	function getPlayerWantsToStart(
		address player
	) public view returns (WantToStartEarly) {
		return s_playersAgreeToPickEarlier[player];
	}
}
