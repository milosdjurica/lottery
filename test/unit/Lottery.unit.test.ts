import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { developmentChains, networkConfig } from "../../utils/helper-config";
import { Lottery, VRFCoordinatorV2Mock } from "../../typechain-types";
import { assert, expect } from "chai";

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

			beforeEach(async () => {
				await deployments.fixture(["all"]);
				deployer = (await getNamedAccounts()).deployer;
				vrfCoordinatorMock = await ethers.getContract(
					"VRFCoordinatorV2Mock",
					deployer,
				);
				lottery = await ethers.getContract("Lottery", deployer);
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
					const accounts = await ethers.getSigners();
					for (let i = 0; i < MAX_NUM_PLAYERS; i++) {
						const lotteryConnected = lottery.connect(accounts[i]);
						await lottery.enterLottery({ value: TICKET_PRICE });
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
			});
		});
