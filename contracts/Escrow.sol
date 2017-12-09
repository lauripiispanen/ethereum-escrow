pragma solidity ^0.4.19;

contract Escrow {

  struct Deposit {
    uint    amount;
    address sender;
    address recipient;
  }

  address public owner;
  bool halted;

  mapping (bytes32 => Deposit) deposits;

  function Escrow() public {
    owner = msg.sender;
    halted = false;
  }

  function halt() public {
    if (msg.sender != owner) {
      revert();
    }
    halted = true;
  }

  function deposit(address _recipient) public payable {
    if (halted) {
      revert();
    } else if (msg.value <= 0) {
      revert();
    }
    var id = keccak256(msg.sender, _recipient, msg.value);
    var d = deposits[id];
    d.recipient = _recipient;
    d.amount = msg.value;
    d.sender = msg.sender;
  }

  function hasDeposit(address _sender, address _recipient, uint _amount) public view returns (bool) {
    var id = keccak256(_sender, _recipient, _amount);
    var d = deposits[id];
    return d.amount == _amount && d.sender == _sender && d.recipient == _recipient;
  }

  function commit(address _recipient, uint _amount) public {
    var id = keccak256(msg.sender, _recipient, _amount);
    if (deposits[id].amount <= 0) {
      revert();
    }
    deposits[id].recipient.transfer(deposits[id].amount);
    delete deposits[id];
  }

  function rollback(address _depositSender, uint _amount) public {
    var id = keccak256(_depositSender, msg.sender, _amount);
    if (deposits[id].amount <= 0) {
      revert();
    }
    deposits[id].sender.transfer(deposits[id].amount);
    delete deposits[id];
  }

}
