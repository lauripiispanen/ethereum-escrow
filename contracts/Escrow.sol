pragma solidity 0.4.19;

contract Escrow {

  struct Deposit {
    uint    amount;
    address sender;
    address recipient;
  }

  address public owner;
  bool public halted;

  mapping (bytes32 => Deposit) public deposits;

  function Escrow() public {
    owner = msg.sender;
    halted = false;
  }

  function halt() public {
    require(msg.sender == owner);
    halted = true;
  }

  function deposit(address _recipient) public payable {
    require(!halted);
    require(msg.value > 0);

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
    require(deposits[id].amount > 0);

    var recipient = deposits[id].recipient;
    var amount = deposits[id].amount;
    delete deposits[id];

    // TRANSFERS MUST ALWAYS OCCUR AFTER STATE CHANGES TO PREVENT REENTRANCY
    assert(deposits[id].amount == 0);
    recipient.transfer(amount);
  }

  function rollback(address _depositSender, uint _amount) public {
    var id = keccak256(_depositSender, msg.sender, _amount);
    require(deposits[id].amount > 0);

    var recipient = deposits[id].sender;
    var amount = deposits[id].amount;
    delete deposits[id];

    // TRANSFERS MUST ALWAYS OCCUR AFTER STATE CHANGES TO PREVENT REENTRANCY
    assert(deposits[id].amount == 0);
    recipient.transfer(amount);
  }

}
