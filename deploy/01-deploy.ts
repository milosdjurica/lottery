import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer } = await hre.getNamedAccounts();
	const { deploy, log } = hre.deployments;

	const example = await deploy("Example", {
		from: deployer,
		args: [], // ! constructor args
		log: true,
	});

	log(`Example contract: `, example.address);
};
export default func;
func.id = "deploy_example"; // id required to prevent re-execution
func.tags = ["Example"];
