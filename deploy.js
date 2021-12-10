const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');

const compiledDonation = require('./build/Donation.json');

const provider = new HDWalletProvider(
  'absorb earth diesel congress inherit page unfold relax team taxi winner keep',
  'https://rinkeby.infura.io/v3/08113a6a0011405aae30abd9f32bf52f'
);

const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();
  console.log('Attempting to deploy from account ', accounts[0]);
  const result = await new web3.eth.Contract(compiledDonation.abi)
    .deploy({
      data: compiledDonation.evm.bytecode.object,
    })
    .send({ from: accounts[0], gas: '1000000' });

  console.log('Contract deployed to', result.options.address);
};

deploy();
