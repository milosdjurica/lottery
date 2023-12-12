import { DeployFunction, DeployResult } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, network } from "hardhat";
import { developmentChains } from "../utils/helper-config";

const BASE_FEE = ethers.parseEther("0.25"); // paying 0.25 LINK every time random numbers are requested
const GAS_PRICE_LINK = 1e9; // calculated value based on the gas price of the chain

const deployMock: DeployFunction = async function (
	hre: HardhatRuntimeEnvironment,
) {
	const { deployer } = await hre.getNamedAccounts();
	const { deploy, log } = hre.deployments;

	if (developmentChains.includes(network.name)) {
		console.log("Local network detected! Deploying mocks...");

		const mock = await deploy("VRFCoordinatorV2Mock", {
			from: deployer,
			args: [BASE_FEE, GAS_PRICE_LINK],
			log: true,
		});

		log("Mocks deployed!!!");
		log("===============================================================");
		console.log(`Mock contract: `, mock.address);
	}
};
export default deployMock;
deployMock.id = "deployer_mock"; // id required to prevent re-execution
deployMock.tags = ["mock", "all"];
