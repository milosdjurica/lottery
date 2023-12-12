import { network } from "hardhat";
import { developmentChains, networkConfig } from "../../utils/helper-config";
import { Lottery, VRFCoordinatorV2Mock } from "../../typechain-types";

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
		});
