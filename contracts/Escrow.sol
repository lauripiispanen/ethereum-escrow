pragma solidity ^0.4.17;

contract Escrow {
  address public owner;

  modifier restricted() {
    if (msg.sender == owner) _;
  }

  function Migrations() public {
    owner = msg.sender;
  }

}
