import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../utils/helper-config";
import { VRFCoordinatorV2Mock } from "../typechain-types";
import { EventLog } from "ethers";
import { verify } from "../utils/verify";

const deployLottery: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment,
) {
	const { ethers, getNamedAccounts, deployments, network } = hre;
	const { deployer } = await getNamedAccounts();
	const { deploy, log } = deployments;
	const CHAIN_ID = network.config.chainId!;

	const VRF_SUB_FUND_AMOUNT = ethers.parseEther("2");
	const IS_DEV_CHAIN = developmentChains.includes(network.name);

	const TICKET_PRICE = networkConfig[CHAIN_ID].lotteryTicketPrice;
	const GAS_LANE = networkConfig[CHAIN_ID].gasLane;
	const CALLBACK_GAS_LIMIT = networkConfig[CHAIN_ID].callbackGasLimit;
	const MAX_NUM_OF_PLAYERS = networkConfig[CHAIN_ID].maxNumOfPlayers;
	let subscriptionId = networkConfig[CHAIN_ID].subscriptionId;

	let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
	let vrfCoordinatorV2Address: string;

	if (IS_DEV_CHAIN) {
		vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
		vrfCoordinatorV2Address = await vrfCoordinatorV2Mock.getAddress();
		const txResponse = await vrfCoordinatorV2Mock.createSubscription();
		const txReceipt = await txResponse.wait(1);
		subscriptionId = await (txReceipt?.logs[0] as EventLog).args.subId;
		await vrfCoordinatorV2Mock.fundSubscription(
			subscriptionId,
			VRF_SUB_FUND_AMOUNT,
		);
	} else {
		vrfCoordinatorV2Address = networkConfig[CHAIN_ID].vrfCoordinatorV2!;
		subscriptionId = networkConfig[CHAIN_ID].subscriptionId;
	}

	const BLOCK_CONFIRMATIONS = IS_DEV_CHAIN ? 1 : 3;

	const constructorArgs = [
		vrfCoordinatorV2Address,
		TICKET_PRICE,
		GAS_LANE,
		subscriptionId,
		CALLBACK_GAS_LIMIT,
		MAX_NUM_OF_PLAYERS,
	];

	log("Deploying lottery contract....");
	const lottery = await deploy("Lottery", {
		from: deployer,
		args: constructorArgs,
		log: true,
		waitConfirmations: BLOCK_CONFIRMATIONS,
	});

	log(`Lottery contract: `, lottery.address);
	log("===============================================================");

	if (!IS_DEV_CHAIN && process.env.ETHERSCAN_API_KEY) {
		log("Verifying contract....");
		await verify(lottery.address, constructorArgs);
	} else {
		// ! Have to add consumer to Mock in order to work
		if (!vrfCoordinatorV2Mock!)
			vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");

		await vrfCoordinatorV2Mock.addConsumer(subscriptionId, lottery.address);
	}
};
export default deployLottery;
deployLottery.id = "deploy_example"; // id required to prevent re-execution
deployLottery.tags = ["lottery", "all"];
