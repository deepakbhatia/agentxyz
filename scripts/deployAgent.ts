import {ethers} from "hardhat";

const AGENT_PROMPT = "You are trained in english language story writing who can write creative and engaging stories";

async function main() {
  //const oracleAddress: string = await deployOracle();
  const oracleAddress: string = process.env.ORACLE_ADDRESS;
  console.log()
  await deployAgent(oracleAddress);
  console.log()
}

async function deployAgent(oracleAddress: string) {
  const agent = await ethers.deployContract(
    "Test13Agent",
    [
      oracleAddress,
      AGENT_PROMPT
    ], {});

  await agent.waitForDeployment();

  console.log(
    `Agent deployed to ${agent.target}`
  );
}



// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
