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
  mapping (bytes32 => address) public mediators;

  function Escrow() public {
    owner = msg.sender;
    halted = false;
  }

  function halt() public {
    require(msg.sender == owner);
    halted = true;
  }

  function unhalt() public {
    require(msg.sender == owner);
    halted = false;
  }

  function deposit(address _recipient, address _mediator) public payable {
    require(!halted);
    require(msg.value > 0);

    var id = keccak256(msg.sender, _recipient, msg.value);
    var d = deposits[id];
    require(d.amount == 0);

    d.recipient = _recipient;
    d.amount = msg.value;
    d.sender = msg.sender;

    mediators[id] = _mediator;
  }

  function hasDeposit(address _sender, address _recipient, uint _amount) public view returns (bool) {
    var id = keccak256(_sender, _recipient, _amount);
    var d = deposits[id];
    return d.amount == _amount && d.sender == _sender && d.recipient == _recipient;
  }

  function getMediator(address _sender, address _recipient, uint _amount) public view returns (address) {
    var id = keccak256(_sender, _recipient, _amount);
    return mediators[id];
  }

  function commit(address _recipient, uint _amount) public {
    var id = keccak256(msg.sender, _recipient, _amount);
    performCommit(id);
  }

  function performCommit(bytes32 _id) private {
    require(deposits[_id].amount > 0);

    var recipient = deposits[_id].recipient;
    var amount = deposits[_id].amount;
    delete deposits[_id];
    delete mediators[_id];

    // TRANSFERS MUST ALWAYS OCCUR AFTER STATE CHANGES TO PREVENT REENTRANCY
    assert(deposits[_id].amount == 0);
    recipient.transfer(amount);
  }

  function commitAsMediator(address _sender, address _recipient, uint _amount) public {
    var id = keccak256(_sender, _recipient, _amount);
    require(mediators[id] == msg.sender);
    performCommit(id);
  }

  function rollback(address _depositSender, uint _amount) public {
    var id = keccak256(_depositSender, msg.sender, _amount);
    performRollback(id);
  }

  function rollbackAsMediator(address _depositSender, address _depositRecipient, uint _amount) public {
    var id = keccak256(_depositSender, _depositRecipient, _amount);
    require(mediators[id] == msg.sender);
    performRollback(id);
  }

  function performRollback(bytes32 _id) private {
    require(deposits[_id].amount > 0);

    var recipient = deposits[_id].sender;
    var amount = deposits[_id].amount;
    delete deposits[_id];
    delete mediators[_id];

    // TRANSFERS MUST ALWAYS OCCUR AFTER STATE CHANGES TO PREVENT REENTRANCY
    assert(deposits[_id].amount == 0);
    recipient.transfer(amount);
  }

}
