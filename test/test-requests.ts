import { ethers } from "ethers";
import { stackrConfig } from "../stackr.config";
import { ActionSchema } from "@stackr/stackr-js";
import actionSchemaType from "../src/action-schema-type";

const actionInput = new ActionSchema("cron-actions", actionSchemaType);

const getRandomValue = (array: any[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

// const getData = async () => {
//   const wallet = ethers.Wallet.createRandom();

//   const mintData = {
//     type: "mint",
//     sender: wallet.address,
//     jobActionsParams: {
//       jobId: 0,
//       reward: "10000",
//       chain: "base",
//       contract: "0xcontract",
//       function: "function",
//       triggerStart: "timestamp",
//       triggerEnd: "timestamp",
//       txHash: "0x...",
//     },
//     creditActionsParams: {
//       from: "0x0",
//       to: wallet.address,
//       amount: "1000000",
//     },
//   };

//   const burnData = {
//     type: "burn",
//     sender: wallet.address,
//     jobActionsParams: {
//       jobId: 0,
//       reward: "10000",
//       chain: "base",
//       contract: "0xcontract",
//       function: "function",
//       triggerStart: "timestamp",
//       triggerEnd: "timestamp",
//       txHash: "0x...",
//     },
//     creditActionsParams: {
//       from: wallet.address,
//       to: "0x0",
//       amount: "900000",
//     },
//   };

//   const mintSign = await wallet.signTypedData(
//     stackrConfig.domain,
//     actionInput.EIP712TypedData.types,
//     mintData
//   );

//   const burnSign = await wallet.signTypedData(
//     stackrConfig.domain,
//     actionInput.EIP712TypedData.types,
//     burnData
//   );

//   const mintPayload = {
//     msgSender: wallet.address,
//     signature: mintSign,
//     payload: mintData,
//   };

//   const burnPayload = {
//     msgSender: wallet.address,
//     signature: burnSign,
//     payload: burnData,
//   };

//   return JSON.stringify([mintPayload, burnPayload]);
// };

const getData = async () => {
  const poster = ethers.Wallet.createRandom();
  const executor = ethers.Wallet.createRandom();

  const mintPayloads = [];
  for (let w of [poster, executor]) {
    let mintData = {
      type: "mint",
      sender: w.address,
      jobActionsParams: {
        jobId: 0,
        reward: "10000",
        chain: "base",
        contract: "0xcontract",
        function: "function",
        triggerStart: "timestamp",
        triggerEnd: "timestamp",
        txHash: "0x...",
      },
      creditActionsParams: {
        from: "0x0",
        to: w.address,
        amount: "1000000",
      },
    };

    let sign = await w.signTypedData(
      stackrConfig.domain,
      actionInput.EIP712TypedData.types,
      mintData
    );

    mintPayloads.push({
      msgSender: w.address,
      signature: sign,
      payload: mintData,
    });
  }

  const createJobPayloads = [];
  for (let i = 0; i < 4; i++) {
    let data = {
      type: "createJob",
      sender: poster.address,
      jobActionsParams: {
        jobId: 0,
        reward: getRandomValue(["10000", "5000", "20000"]),
        chain: getRandomValue(["base", "arbitrum", "ethereum", "optimism"]),
        contract: getRandomValue(["0xcontract", "0xcontract2", "0xcontract3"]),
        function: getRandomValue(["function1", "function2", "function3"]),
        triggerStart: (
          new Date().getTime() +
          getRandomValue([10_0000, 60_0000, 2 * 60_0000, 30_0000])
        ).toString(),
        triggerEnd: (
          new Date().getTime() +
          getRandomValue([
            2.5 * 60_0000,
            3 * 60_0000,
            3.5 * 60_0000,
            4.5 * 60_0000,
          ])
        ).toString(),
        txHash: "0x...",
      },
      creditActionsParams: {
        from: "0x0",
        to: poster.address,
        amount: "1000000",
      },
    };

    let sign = await poster.signTypedData(
      stackrConfig.domain,
      actionInput.EIP712TypedData.types,
      data
    );

    createJobPayloads.push({
      msgSender: poster.address,
      signature: sign,
      payload: data,
    });
  }

  const finishJobPayloads = [];
  for (let i = 0; i < 2; i++) {
    let data = {
      type: "finishJob",
      sender: executor.address,
      jobActionsParams: {
        jobId: getRandomValue([1, 2, 3, 4]),
        // jobId: 2,
        reward: "",
        chain: "",
        contract: "",
        function: "",
        triggerStart: "",
        triggerEnd: "",
        txHash: "0xhash1",
      },
      creditActionsParams: {
        from: "0x0",
        to: poster.address,
        amount: "1000000",
      },
    };

    let sign = await executor.signTypedData(
      stackrConfig.domain,
      actionInput.EIP712TypedData.types,
      data
    );

    finishJobPayloads.push({
      msgSender: executor.address,
      signature: sign,
      payload: data,
    });
  }

  return JSON.stringify([
    ...mintPayloads,
    ...createJobPayloads,
    ...finishJobPayloads,
  ]);
};

const run = async () => {
  const start = Date.now();
  const payload = await getData();

  const res = await fetch("http://localhost:3000/", {
    method: "POST",
    body: payload,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const end = Date.now();

  const json = await res.json();

  const elapsedSeconds = (end - start) / 1000;
  const requestsPerSecond = 1 / elapsedSeconds;

  console.log(`Requests per second: ${requestsPerSecond.toFixed(2)}`);
  console.log("response : ", json);
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

await run();
