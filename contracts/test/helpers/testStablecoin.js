const solc = require('solc');
const { ethers } = require('hardhat');

const source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TestStablecoin {
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply,
        address initialHolder
    ) {
        require(initialHolder != address(0), "holder=0");
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
        _mint(initialHolder, initialSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 approved = allowance[from][msg.sender];
        require(approved >= amount, "allowance");

        if (approved != type(uint256).max) {
            allowance[from][msg.sender] = approved - amount;
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }

        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "to=0");
        uint256 balance = balanceOf[from];
        require(balance >= amount, "balance");

        balanceOf[from] = balance - amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
`;

let compiledStablecoin;

function getCompiledStablecoin() {
  if (compiledStablecoin) {
    return compiledStablecoin;
  }

  const output = JSON.parse(
    solc.compile(
      JSON.stringify({
        language: 'Solidity',
        sources: {
          'TestStablecoin.sol': {
            content: source
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode.object']
            }
          }
        }
      })
    )
  );

  const errors = (output.errors || []).filter((error) => error.severity === 'error');
  if (errors.length) {
    throw new Error(errors.map((error) => error.formattedMessage || error.message).join('\n'));
  }

  const contract = output.contracts['TestStablecoin.sol'].TestStablecoin;
  compiledStablecoin = {
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`
  };
  return compiledStablecoin;
}

async function deployTestStablecoin({ name, symbol, decimals, initialSupply, initialHolder }) {
  const [deployer] = await ethers.getSigners();
  const { abi, bytecode } = getCompiledStablecoin();
  const factory = new ethers.ContractFactory(abi, bytecode, deployer);
  const stablecoin = await factory.deploy(name, symbol, decimals, initialSupply, initialHolder);
  await stablecoin.waitForDeployment();
  return stablecoin;
}

module.exports = {
  deployTestStablecoin
};
