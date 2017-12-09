const Escrow = artifacts.require("Escrow");

contract('Escrow', function(accounts) {
  it("gets deployed", async function() {
    var instance = await Escrow.deployed()
    assert.notEqual(instance, null, "Contract was null");
  });
  it("allows deposits", async function() {
    var instance = await Escrow.deployed()
    await instance.deposit.sendTransaction(accounts[1], { from: accounts[0], value: 100 })

    assert.ok(await instance.hasDeposit(accounts[0], accounts[1], 100), "deposit not found")
    assert.ok(!(await instance.hasDeposit(accounts[0], accounts[2], 100)), "deposit should not exist")
  })
})
