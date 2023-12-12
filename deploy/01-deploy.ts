import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkConfig } from "../utils/helper-config";
import { VRFCoordinatorV2Mock } from "../typechain-types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { ethers, getNamedAccounts, deployments, network } = hre;
	const { deployer } = await getNamedAccounts();
	const { deploy, log } = deployments;
	const ticketPrice = ethers.parseEther("0.01");
	const chainId = network.config.chainId!;
	// console.log("ticketPrice", ticketPrice);

	const VRF_SUB_FUND_AMOUNT = ethers.parseEther("2");

	const TICKET_PRICE = networkConfig[chainId].lotteryTicketPrice;
	const gasLane = networkConfig[chainId].gasLane;
	const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
	let subscriptionId = networkConfig[chainId].subscriptionId;

	let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
	let vrfCoordinatorV2Address: string;

	const lottery = await deploy("Lottery", {
		from: deployer,
		args: [ticketPrice], // ! constructor args
		log: true,
	});

	log(`Lottery contract: `, lottery.address);
};
export default func;
func.id = "deploy_example"; // id required to prevent re-execution
func.tags = ["lottery", "all"];
