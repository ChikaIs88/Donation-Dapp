// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Donation {
    address public manager;
    address public currentWinner;
    address payable[] public donators;

    constructor() {
        manager = msg.sender;
    }

    function enter() public payable {
        require(msg.value > .001 ether);
        donators.push(payable(msg.sender));
    }

    function random() private view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.difficulty,
                        block.timestamp,
                        donators
                    )
                )
            );
    }

    function pickWinner() public restricted {
        uint256 index = random() % donators.length;
        currentWinner = donators[index];
        donators[index].transfer(address(this).balance);
        donators = new address payable[](0);
    }

    function getDonators() public view returns (address payable[] memory) {
        return donators;
    }

    function getCurrentWinner() public view returns (address) {
        return currentWinner;
    }

    modifier restricted() {
        require(msg.sender == manager);
        _;
    }
}
