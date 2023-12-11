import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { ethers, getNamedAccounts, deployments } = hre;
	const { deployer } = await getNamedAccounts();
	const { deploy, log } = deployments;
	const ticketPrice = ethers.parseEther("0.01");
	console.log("ticketPrice", ticketPrice);

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
