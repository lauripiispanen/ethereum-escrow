const Escrow = artifacts.require("Escrow")

contract('Escrow', (accounts) => {
  it("gets deployed", async () => {
    const instance = await Escrow.deployed()
    assert.notEqual(instance, null, "Contract was null")
  })
  it("allows deposits", async () => {
    const instance = await Escrow.deployed()
    await instance.deposit.sendTransaction(accounts[1], { from: accounts[0], value: 100 })

    assert.ok(await instance.hasDeposit(accounts[0], accounts[1], 100), "deposit not found")
    assert.ok(!(await instance.hasDeposit(accounts[0], accounts[2], 100)), "deposit should not exist")
  })
  it("allows commits", async () => {
    const value = 200
    const instance = await Escrow.deployed()
    await instance.deposit.sendTransaction(accounts[1], { from: accounts[0], value })
    const origBalance = web3.eth.getBalance(accounts[1]).toNumber()

    await instance.commit.sendTransaction(accounts[1], value, { from: accounts[0] })
    const newBalance = web3.eth.getBalance(accounts[1]).toNumber()

    assert.equal(newBalance, origBalance + value, "target account balance should have increased")

  })
})
