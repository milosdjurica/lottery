import { run } from "hardhat";

export async function verify(contractAddress: string, args: any[]) {
	console.log("Verifying...");

	try {
		await run("verify:verify", {
			address: contractAddress,
			constructorArguments: args,
		});
	} catch (error: any) {
		if (error.message.toLowerCase().includes("already verified")) {
			console.log("Contract is already verified!");
		}
		console.log("error", error);
	}
}
