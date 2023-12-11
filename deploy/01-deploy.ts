import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer } = await hre.getNamedAccounts();
	const { deploy, log } = hre.deployments;

	const lottery = await deploy("Lottery", {
		from: deployer,
		args: [], // ! constructor args
		log: true,
	});

	log(`Lottery contract: `, lottery.address);
};
export default func;
func.id = "deploy_example"; // id required to prevent re-execution
func.tags = ["lottery", "all"];
