import { RollupState, STF } from "@stackr/stackr-js/execution";
import { ethers } from "ethers";

type address = `0x${string}`;
export type StateVariable = {
  jobs: {
    id: number;
    owner: address;
    // status: "created" | "finished" | "cancelled";
    status: string;
    // The reward will be denominated in ETH.
    reward: string;
    txHash: string;
    jobDetails: {
      chain: string;
      exec: {
        contract: string;
        function: string;
      };
      triggerWindow: {
        start: string;
        end: string;
      };
    };
  }[];
  credits: {
    address: string;
    balance: string;
  }[];
};

interface StateTransport {
  directory: StateVariable;
}

export interface CronActionInput {
  type: "createJob" | "removeJob" | "finishJob" | "mint" | "burn";
  sender: address;
  currentTimestamp: string;
  jobActionsParams: {
    jobId: number;
    reward: string;
    chain: string;
    contract: string;
    function: string;
    triggerStart: string;
    triggerEnd: string;
    txHash: string;
  };
  creditActionsParams: {
    from: address;
    to: address;
    amount: string;
  };
}

export class CronRollup extends RollupState<StateVariable, StateTransport> {
  constructor(directory: StateVariable) {
    super(directory);
  }

  createTransport(state: StateVariable): StateTransport {
    return { directory: state };
  }

  getState(): StateVariable {
    return this.transport.directory;
  }

  calculateRoot(): ethers.BytesLike {
    return ethers.solidityPackedKeccak256(
      ["string"],
      [JSON.stringify(this.transport.directory)]
    );
  }
}

export const cronSTF: STF<CronRollup, CronActionInput> = {
  identifier: "cronSTF",

  apply(inputs: CronActionInput, state: CronRollup): void {
    let newState = state.getState();
    switch (inputs.type) {
      case "createJob":
        newState = createJobAction(inputs, newState);
        break;
      case "removeJob":
        newState = removeJobAction(inputs, newState);
        break;
      case "finishJob":
        newState = finishJobAction(inputs, newState);
        break;
      case "mint":
        newState = mintAction(inputs, newState);
        break;
      case "burn":
        newState = burnAction(inputs, newState);
        break;
      default:
        throw new Error("*** Invalid Action Type ***");
        break;
    }

    state.transport.directory = newState;
  },
};

// 🚧
function createJobAction(
  inputs: CronActionInput,
  state: StateVariable
): StateVariable {
  // Implement the logic for the createJob action
  // Update the state variable accordingly

  /* 
    Checks to implement:
     - The user should have more credits than the total reward of all the jobs to be created 
  */

  let newId =
    state.jobs.length === 0 ? 1 : state.jobs[state.jobs.length - 1].id + 1;

  state.jobs.push({
    id: newId,
    owner: inputs.sender as address,
    status: "created",
    reward: inputs.jobActionsParams.reward,
    txHash: "",
    jobDetails: {
      chain: inputs.jobActionsParams.chain,
      exec: {
        contract: inputs.jobActionsParams.contract,
        function: inputs.jobActionsParams.function,
      },
      triggerWindow: {
        start: inputs.jobActionsParams.triggerStart,
        end: inputs.jobActionsParams.triggerEnd,
      },
    },
  });

  return state;
}

// 🚧
function removeJobAction(
  inputs: CronActionInput,
  state: StateVariable
): StateVariable {
  // Implement the logic for the removeJob action
  // Update the state variable accordingly

  const jobIndex = findJobIndexById(inputs.jobActionsParams.jobId, state);
  if (jobIndex == -1) {
    throw new Error("*** Job Not Found ***");
  }

  state.jobs[jobIndex].status = "cancelled";

  return state;
}

function finishJobAction(
  inputs: CronActionInput,
  state: StateVariable
): StateVariable {
  const jobIndex = state.jobs.findIndex(
    (j) => j.id === inputs.jobActionsParams.jobId
  );
  if (jobIndex === -1) {
    throw new Error("*** Job Not Found ***");
  }

  let job = state.jobs[jobIndex];

  job.status = "finished";
  job.txHash = inputs.jobActionsParams.txHash;
  state.jobs[jobIndex] = job;

  return payExecutor(job.owner, inputs.sender, job.reward, state);
}

function mintAction(
  inputs: CronActionInput,
  state: StateVariable
): StateVariable {
  // Implement the logic for the mint action
  // Update the state variable accordingly

  const idx = findAccountIndexByAddress(inputs.creditActionsParams.to, state);
  if (idx === -1) {
    createNewCreditAccount(inputs.creditActionsParams.to, state);
  }

  const lastIdx = state.credits.length - 1;

  state.credits[lastIdx].balance = (
    BigInt(state.credits[lastIdx].balance) +
    BigInt(inputs.creditActionsParams.amount)
  ).toString();

  return state;
}

function burnAction(
  inputs: CronActionInput,
  state: StateVariable
): StateVariable {
  // Implement the logic for the burn action
  // Update the state variable accordingly

  const idx = findAccountIndexByAddress(inputs.creditActionsParams.from, state);
  state.credits[idx].balance = (
    BigInt(state.credits[idx].balance) -
    BigInt(inputs.creditActionsParams.amount)
  ).toString();

  return state;
}

// function payAction(
//   inputs: CronActionInput,
//   state: StateVariable
// ): StateVariable {
//   // Implement the logic for the pay action
//   // Update the state variable accordingly

//   const payerIdx = findAccountIndexByAddress(
//     inputs.creditActionsParams.from,
//     state
//   );
//   const payeeIdx = findAccountIndexByAddress(
//     inputs.creditActionsParams.to,
//     state
//   );

//   if (payeeIdx === -1) {
//     createNewCreditAccount(inputs.creditActionsParams.to, state);
//   }

//   return state;
// }

/* UTILITY FUNCTIONS */
function findJobIndexById(id: number, state: StateVariable): number {
  return state.jobs.findIndex((job) => job.id === id);
}

function findAccountIndexByAddress(
  account: string,
  state: StateVariable
): number {
  return state.credits.findIndex((acc) => acc.address === account);
}

function createNewCreditAccount(
  address: string,
  state: StateVariable
): StateVariable {
  state.credits.push({
    address,
    balance: "0",
  });

  return state;
}

function payExecutor(
  payer: string,
  payee: string,
  amount: string,
  state: StateVariable
): StateVariable {
  const payerIdx = findAccountIndexByAddress(payer, state);
  const payeeIdx = findAccountIndexByAddress(payee, state);

  if (payeeIdx === -1) {
    state = createNewCreditAccount(payee, state);
  }

  state.credits[payerIdx].balance = (
    BigInt(state.credits[payerIdx].balance) - BigInt(amount)
  ).toString();
  state.credits[payeeIdx].balance = (
    BigInt(state.credits[payeeIdx].balance) + BigInt(amount)
  ).toString();

  return state;
}
