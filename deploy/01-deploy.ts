import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../utils/helper-config";
import { VRFCoordinatorV2Mock } from "../typechain-types";
import { EventLog } from "ethers";
import { verify } from "../utils/verify";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { ethers, getNamedAccounts, deployments, network } = hre;
	const { deployer } = await getNamedAccounts();
	const { deploy, log } = deployments;
	const ticketPrice = ethers.parseEther("0.01");
	const chainId = network.config.chainId!;
	// console.log("ticketPrice", ticketPrice);
	const DEV_CHAIN = developmentChains.includes(network.name);
	const MAX_NUM_OF_PLAYERS = 3;
	const VRF_SUB_FUND_AMOUNT = ethers.parseEther("2");

	const TICKET_PRICE = networkConfig[chainId].lotteryTicketPrice;
	const gasLane = networkConfig[chainId].gasLane;
	const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
	let subscriptionId = networkConfig[chainId].subscriptionId;

	let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
	let vrfCoordinatorV2Address: string;

	if (DEV_CHAIN) {
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
		vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2!;
		subscriptionId = networkConfig[chainId].subscriptionId;
	}

	const BLOCK_CONFIRMATIONS = DEV_CHAIN ? 1 : 3;

	const constructorArgs = [
		vrfCoordinatorV2Address,
		TICKET_PRICE,
		gasLane,
		subscriptionId,
		callbackGasLimit,
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

	if (!DEV_CHAIN && process.env.ETHERSCAN_API_KEY) {
		log("Verifying contract....");
		verify(lottery.address, constructorArgs);
	} else {
		// ! Have to add consumer to Mock in order to work
		if (!vrfCoordinatorV2Mock!)
			vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");

		await vrfCoordinatorV2Mock.addConsumer(subscriptionId, lottery.address);
	}
};
export default func;
func.id = "deploy_example"; // id required to prevent re-execution
func.tags = ["lottery", "all"];
