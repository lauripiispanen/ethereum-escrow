pragma solidity ^0.4.19;

contract Escrow {

  struct Deposit {
    uint    amount;
    address sender;
    address recipient;
  }

  address public owner;

  mapping (bytes32 => Deposit) deposits;

  function Escrow() public {
    owner = msg.sender;
  }

  function deposit(address _recipient) public payable {
    var id = keccak256(msg.sender, _recipient, msg.value);
    var d = deposits[id];
    d.recipient = _recipient;
    d.amount = msg.value;
    d.sender = msg.sender;
  }

  function hasDeposit(address _sender, address _recipient, uint _amount) public view returns (bool) {
    var id = keccak256(msg.sender, _recipient, _amount);
    var d = deposits[id];
    return d.amount == _amount && d.sender == _sender && d.recipient == _recipient;
  }

}
