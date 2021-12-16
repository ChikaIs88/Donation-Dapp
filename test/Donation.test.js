const assert = require("assert");
const ganache = require("ganache-core");
const Web3 = require("web3");
const { abi, evm } = require("../build/Donation.json");

const bytecode = evm.bytecode.object;
let donation, accounts;

const web3 = new Web3(ganache.provider());

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  donation = await new web3.eth.Contract(abi)
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: 1000000 });
});

describe("Donation Contract", () => {
  it("deploys a contract", () => {
    assert.ok(donation.options.address);
  });

  it("allows one account to enter", async () => {
    await donation.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.02", "ether"),
    });
    const donators = await donation.methods.getDonators().call({
      from: accounts[0],
    });

    assert.equal(accounts[0], donators[0]);
    assert.equal(1, donators.length);
  });

  it("allows multiple accounts to enter", async () => {
    for (let i = 0; i < 3; i++) {
      await donation.methods.enter().send({
        from: accounts[i],
        value: web3.utils.toWei("0.02", "ether"),
      });
    }

    const donators = await donation.methods.getDonators().call({
      from: accounts[0],
    });

    for (let i = 0; i < 3; i++) {
      assert.equal(accounts[i], donators[i]);
    }
    assert.equal(3, donators.length);
  });

  it("requires a minimum amount of ether to enter", async () => {
    try {
      await donation.methods.enter().send({
        from: accounts[0],
        value: 200,
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("only manager can call pickRecipient", async () => {
    try {
      await donation.methods.pickRecipient().send({
        from: accounts[1],
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("sends money to the recipient and resets the donators array", async () => {
    await donation.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether"),
    });

    const initialBalance = await web3.eth.getBalance(accounts[0]);
    await donation.methods.pickRecipient().send({ from: accounts[0] });
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;

    assert(difference > web3.utils.toWei("1.8", "ether"));
  });

  it("donators array is reset after a recipient is picked", async () => {
    await donation.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether"),
    });

    await donation.methods.pickRecipient().send({ from: accounts[0] });

    const donators = await donation.methods.getDonators().call({
      from: accounts[0],
    });

    assert.equal(0, donators.length);
  });
});
