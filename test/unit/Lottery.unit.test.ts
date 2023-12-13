import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { developmentChains, networkConfig } from "../../utils/helper-config";
import { Lottery, VRFCoordinatorV2Mock } from "../../typechain-types";
import { assert, expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const isDevelopmentChain = developmentChains.includes(network.name);

!isDevelopmentChain
	? describe.skip
	: describe("Lottery Unit Tests", () => {
			const CHAIN_ID = network.config.chainId!!!;
			const TICKET_PRICE = networkConfig[CHAIN_ID].lotteryTicketPrice;
			const MAX_NUM_PLAYERS = networkConfig[CHAIN_ID].maxNumOfPlayers;

			let lottery: Lottery;
			let deployer: string;
			let vrfCoordinatorMock: VRFCoordinatorV2Mock;
			let accounts: HardhatEthersSigner[];

			beforeEach(async () => {
				await deployments.fixture(["all"]);
				deployer = (await getNamedAccounts()).deployer;
				vrfCoordinatorMock = await ethers.getContract(
					"VRFCoordinatorV2Mock",
					deployer,
				);
				lottery = await ethers.getContract("Lottery", deployer);
				accounts = await ethers.getSigners();
			});

			describe("Constructor Tests", () => {
				it("Sets ticket price correctly", async () => {
					assert.equal(TICKET_PRICE, await lottery.getTicketPrice());
				});

				it("Sets the VRFCoordinator correctly", async () => {
					assert.equal(
						await vrfCoordinatorMock.getAddress(),
						await lottery.getVrfCoordinator(),
					);
				});

				it("Sets lottery state to OPEN", async () => {
					assert.equal(0, Number(await lottery.getLotteryState()));
				});

				it("Sets max number of players correctly", async () => {
					assert.equal(
						MAX_NUM_PLAYERS,
						Number(await lottery.getMaxNumOfPlayers()),
					);
				});
			});

			describe("Enter Lottery Tests", () => {
				it("Reverts if more accounts than max number", async () => {
					for (let i = 0; i < MAX_NUM_PLAYERS; i++) {
						const lotteryConnected = lottery.connect(accounts[i]);
						await lotteryConnected.enterLottery({ value: TICKET_PRICE });
					}
					await expect(
						lottery.enterLottery({
							value: TICKET_PRICE,
						}),
					).to.be.revertedWithCustomError(lottery, "Lottery__AlreadyFull");
				});

				it("Reverts if called without money", async () => {
					await expect(lottery.enterLottery()).to.be.revertedWithCustomError(
						lottery,
						"Lottery__NotEnoughETH",
					);
				});

				it("Reverts if not enough ETH sent", async () => {
					await expect(
						lottery.enterLottery({ value: TICKET_PRICE - BigInt(1) }),
					).to.be.revertedWithCustomError(lottery, "Lottery__NotEnoughETH");
				});

				// Coverage ->  43.24 |    35.71 |    61.54 |     45.9 |
				it("Should return if extra money sent", async () => {
					const deployerBalanceBefore =
						await ethers.provider.getBalance(deployer);
					const txResponse = await lottery.enterLottery({
						value: TICKET_PRICE * BigInt(2),
					});
					const txReceipt = await txResponse.wait(1);
					const gasPrice = txReceipt?.gasPrice!;
					const gasUsed = txReceipt?.gasUsed!;
					const totalCost = gasUsed * gasPrice;
					const deployerBalanceAfter =
						await ethers.provider.getBalance(deployer);

					assert.equal(
						deployerBalanceBefore - TICKET_PRICE - totalCost,
						deployerBalanceAfter,
					);
				});

				// Coverage ->  43.24 |    35.71 |    61.54 |     45.9 |
				it("Contract should only take ticket price fee", async () => {
					await lottery.enterLottery({ value: TICKET_PRICE * BigInt(2) });
					assert.equal(await ethers.provider.getBalance(lottery), TICKET_PRICE);
				});

				it("Adds player to array of players", async () => {
					await lottery.enterLottery({ value: TICKET_PRICE });
					assert.equal(await lottery.getPlayer(0), deployer);
				});

				// Coverage ->  44.74 |    35.71 |    64.29 |    46.77
				it("Panic revert if accessing non-existing index", async () => {
					await lottery.enterLottery({ value: TICKET_PRICE });
					await expect(lottery.getPlayer(1)).to.be.revertedWithPanic(0x32);
				});

				// Coverage -> 46.15 |    35.71 |    66.67 |    47.62
				it("Player enters with WantsToStartEarly.NO", async () => {
					await lottery.enterLottery({ value: TICKET_PRICE });

					assert.equal(
						await lottery.getPlayerWantsToStart(deployer),
						BigInt(1),
					);
				});

				// Coverage -> 46.15 |    35.71 |    66.67 |    47.62
				it("Emits that player entered lottery", async () => {
					await expect(lottery.enterLottery({ value: TICKET_PRICE }))
						.to.emit(lottery, "LotteryEnter")
						.withArgs(deployer, 1);
				});
			});

			// for picking winner beforeEach -> when everyone is there
			// or everyone agrees to pick earlier
			// check both
			describe("Leave Lottery Tests", () => {
				const NUM_OF_ACTIVE_PLAYERS = 3;

				beforeEach(async () => {
					await lottery.enterLottery({ value: TICKET_PRICE });
					for (let i = 0; i < NUM_OF_ACTIVE_PLAYERS; i++) {
						const playerLottery = lottery.connect(accounts[i]);
						await playerLottery.enterLottery({ value: TICKET_PRICE });
					}
				});

				// Coverage -> 58.97 |    46.43 |    73.33 |    58.73
				it("Reverts if player calling leave() is not in array", async () => {
					// ! Not using deployer because he entered lottery in beforeEach
					const playerNotInArray = accounts[NUM_OF_ACTIVE_PLAYERS + 1];
					const playerLottery = lottery.connect(playerNotInArray);
					const playerAddress = await playerNotInArray.getAddress();

					await expect(playerLottery.leave())
						.to.be.revertedWithCustomError(
							playerLottery,
							"Lottery__PlayerNotInArray",
						)
						.withArgs(playerAddress);
				});

				it("Puts last player on index", async () => {});
				it("Removes indexed player", async () => {});
				it("Compare whole arrays", async () => {});
				it("Emits event", async () => {});
				it("Agreed to pick earlier back to NONE (because he isnt active player anymore)", async () => {});
			});
		});
