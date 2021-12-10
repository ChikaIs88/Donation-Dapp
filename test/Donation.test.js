const assert = require('assert');
const ganache = require('ganache-core');
const Web3 = require('web3');
const { abi, evm } = require('../build/Donation.json');

const bytecode = evm.bytecode.object;
let donation, accounts;

const web3 = new Web3(ganache.provider());

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  donation = await new web3.eth.Contract(abi)
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: 1000000 });
});

describe('Donation Contract', () => {
  it('deploys a contract', () => {
    assert.ok(donation.options.address);
  });

  it('allows one account to enter', async () => {
    await donation.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether'),
    });
    const players = await donation.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it('allows multiple accounts to enter', async () => {
    for (let i = 0; i < 3; i++) {
      await donation.methods.enter().send({
        from: accounts[i],
        value: web3.utils.toWei('0.02', 'ether'),
      });
    }

    const players = await donation.methods.getPlayers().call({
      from: accounts[0],
    });

    for (let i = 0; i < 3; i++) {
      assert.equal(accounts[i], players[i]);
    }
    assert.equal(3, players.length);
  });

  it('requires a minimum amount of ether to enter', async () => {
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

  it('only manager can call pickWinner', async () => {
    try {
      await donation.methods.pickWinner().send({
        from: accounts[1],
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('sends money to the winner and resets the players array', async () => {
    await donation.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('2', 'ether'),
    });

    const initialBalance = await web3.eth.getBalance(accounts[0]);
    await donation.methods.pickWinner().send({ from: accounts[0] });
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;

    assert(difference > web3.utils.toWei('1.8', 'ether'));
  });

  it('players array is reset after a winner is picked', async () => {
    await donation.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('2', 'ether'),
    });

    await donation.methods.pickWinner().send({ from: accounts[0] });

    const players = await donation.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.equal(0, players.length);
  });
});
