import { ethers, getNamedAccounts, network } from "hardhat";
import { Lottery } from "../../typechain-types";
import { developmentChains, networkConfig } from "../../utils/helper-config";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { assert } from "chai";

const isDevelopmentChain = developmentChains.includes(network.name);

isDevelopmentChain
	? describe.skip
	: describe("Lottery Staging Tests", () => {
			console.log("Entered Staging Tests");
			const CHAIN_ID = network.config.chainId!!!;
			const TICKET_PRICE = networkConfig[CHAIN_ID].lotteryTicketPrice;

			let lottery: Lottery;
			let deployer: string;
			let accounts: HardhatEthersSigner[];
			let playerAccount: HardhatEthersSigner;

			beforeEach(async () => {
				console.log("Before Each");
				deployer = (await getNamedAccounts()).deployer;
				lottery = await ethers.getContract("Lottery", deployer);
				accounts = await ethers.getSigners();
				playerAccount = accounts[1];
			});

			describe("FulfillRandomWords Staging Tests", () => {
				it("Works with Chainlink VRF, picks random winner, and after that puts LotteryState to OPEN, removes players from array, and resets mapping WantsToPickEarly to NONE", async () => {
					const event = lottery.getEvent("WinnerPicked");

					await new Promise<void>(async (resolve, reject) => {
						lottery.once(event, async () => {
							console.log("WinnerPicked event fired");
							try {
								const recentWinner = await lottery.getRecentWinner();
								console.log("recentWinner", recentWinner);
								const lotteryState = await lottery.getLotteryState();

								assert.equal(lotteryState, BigInt(0));
								assert.equal(await lottery.getNumOfActivePlayers(), BigInt(0));
								assert.equal(
									await lottery.getPlayerWantsToStart(accounts[0]),
									BigInt(0),
								);

								assert.equal(
									await lottery.getPlayerWantsToStart(accounts[1]),
									BigInt(0),
								);
								resolve();
							} catch (error) {
								reject(error);
							}
						});

						console.log("Starting first test");
						await lottery.enterLottery({
							value: TICKET_PRICE,
						});
						await lottery
							.connect(playerAccount)
							.enterLottery({ value: TICKET_PRICE });
						console.log("Players entered lottery");
					});
				});
			});
		});
