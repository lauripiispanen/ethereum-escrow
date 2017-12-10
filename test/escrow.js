const Escrow = artifacts.require("Escrow")

contract('Escrow', (accounts) => {
  it("gets deployed", async () => {
    const instance = await Escrow.new()
    assert.notEqual(instance, null, "Contract was null")
  })
  it("allows deposits", async () => {
    const instance = await Escrow.new()
    await instance.deposit(accounts[1], accounts[3], { from: accounts[0], value: 100 })

    assert.ok(await instance.hasDeposit(accounts[0], accounts[1], 100), "deposit not found")
    assert.ok(!(await instance.hasDeposit(accounts[0], accounts[2], 100)), "deposit should not exist")
  })
  it("allows commits", async () => {
    const value = 200
    const instance = await Escrow.new()
    await instance.deposit(accounts[1], accounts[3], { from: accounts[0], value })
    const origBalance = web3.eth.getBalance(accounts[1]).toNumber()

    await instance.commit(accounts[1], value, { from: accounts[0] })
    const newBalance = web3.eth.getBalance(accounts[1]).toNumber()

    assert.equal(newBalance, origBalance + value, "target account balance should have increased")
  })
  it("allows commits by mediator", async () => {
    const value = 200
    const instance = await Escrow.new()
    await instance.deposit(accounts[1], accounts[2], { from: accounts[0], value })
    const origBalance = web3.eth.getBalance(accounts[1]).toNumber()

    await instance.commitAsMediator(accounts[0], accounts[1], value, { from: accounts[2] })
    const newBalance = web3.eth.getBalance(accounts[1]).toNumber()

    assert.equal(newBalance, origBalance + value, "target account balance should have increased")
  })
  it("disallows false mediators", async () => {
    const value = 200
    const instance = await Escrow.new()
    await instance.deposit(accounts[1], accounts[2], { from: accounts[0], value })
    const origBalance = web3.eth.getBalance(accounts[1]).toNumber()

    await assertThrowsAsync(async () => {
      await instance.commitAsMediator(accounts[0], accounts[1], value, { from: accounts[3] })
    }, /revert/)
    await assertThrowsAsync(async () => {
      await instance.rollbackAsMediator(accounts[0], accounts[1], value, { from: accounts[3] })
    }, /revert/)
  })
  it("prevents double-committing", async () => {
    const value = 200
    const instance = await Escrow.new()
    await instance.deposit(accounts[1], accounts[3], { from: accounts[0], value })
    await instance.deposit(accounts[2], accounts[3], { from: accounts[0], value })
    await instance.commit(accounts[1], value, { from: accounts[0] })
    await assertThrowsAsync(async () => {
        await instance.commit(accounts[1], value, { from: accounts[0] })
    }, /revert/)
  })
  it("cannot deposit zero", async () => {
    const instance = await Escrow.new()
    /* TODO: Ethereum VM doesn't support this, but web3 doesn't fail
    await assertThrowsAsync(async () => {
      const s = await instance.deposit.sendTransaction(accounts[1], { from: accounts[0], value: -100 })
    }, /revert/)
    */
    await assertThrowsAsync(async () => {
      await instance.deposit(accounts[1], accounts[3], { from: accounts[0], value: 0 })
    }, /revert/)
  })
  it("cannot deposit twice to prevent losing ether", async () => {
    const instance = await Escrow.new()
    await instance.deposit(accounts[1], accounts[3], { from: accounts[0], value: 100 })
    await assertThrowsAsync(async () => {
      await instance.deposit(accounts[1], accounts[3], { from: accounts[0], value: 100 })
    }, /revert/)
  })
  it("can be rollbacked by recipient", async () => {
    const value = 10000
    const gasPrice = 10
    const instance = await Escrow.new()
    const originalBalance = web3.eth.getBalance(accounts[0]).toNumber()
    const { tx, receipt } = await instance.deposit(accounts[1], accounts[3], { from: accounts[0], value, gasPrice })
    const gasCost = receipt.gasUsed * gasPrice

    await instance.rollback(accounts[0], value, { from: accounts[1] })
    const newBalance = web3.eth.getBalance(accounts[0]).toNumber()
    assert.equal(newBalance, originalBalance - gasCost, "original account balance minus gas costs should be returned")
  })
  it("cannot be rollbacked twice", async () => {
    const instance = await Escrow.new()
    const value = 12345
    await instance.deposit(accounts[1], accounts[3], { from: accounts[0], value })
    await instance.deposit(accounts[2], accounts[3], { from: accounts[0], value })

    await instance.rollback(accounts[0], value, { from: accounts[1] })
    const balance = web3.eth.getBalance(accounts[0]).toNumber()

    await assertThrowsAsync(async () => {
      await instance.rollback(accounts[0], value, { from: accounts[1] })
    }, /revert/)

    assert.equal(balance, web3.eth.getBalance(accounts[0]).toNumber(), "account balance should be unchanged")
  })
  it("can be rollbacked by mediator", async () => {
    const value = 10000
    const gasPrice = 10
    const instance = await Escrow.new()
    const originalBalance = web3.eth.getBalance(accounts[0]).toNumber()
    const { tx, receipt } = await instance.deposit(accounts[1], accounts[3], { from: accounts[0], value, gasPrice })
    const gasCost = receipt.gasUsed * gasPrice

    await instance.rollbackAsMediator(accounts[0], accounts[1], value, { from: accounts[3] })
    const newBalance = web3.eth.getBalance(accounts[0]).toNumber()
    assert.equal(newBalance, originalBalance - gasCost, "original account balance minus gas costs should be returned")
  })
  it("can be halted and unhalted", async () => {
    const instance = await Escrow.new()
    await instance.halt({ from: accounts[0] })
    await assertThrowsAsync(async () => {
      await instance.deposit(accounts[1], accounts[3], { from: accounts[0], value: 1000 })
    }, /revert/)
    await instance.unhalt({ from: accounts[0] })
    await instance.deposit(accounts[1], accounts[3], { from: accounts[0], value: 1000 })
    assert.ok(await instance.hasDeposit(accounts[0], accounts[1], 1000), "deposit not found")
  })
  it("can only be halted or unhalted by owner", async () => {
    const instance = await Escrow.new()
    await assertThrowsAsync(async () => {
      await instance.halt({ from: accounts[1] })
    }, /revert/)
    await assertThrowsAsync(async () => {
      await instance.unhalt({ from: accounts[1] })
    }, /revert/)
  })
  it("prevents ether from being sent directly (fallback)", async () => {
    // This behavior is default since Solidity v0.4.0, but we will prove it anyway
    const instance = await Escrow.new()
    await assertThrowsAsync(async () => {
      await instance.send(web3.toWei(1, "ether"))
    }, /revert/)
  })
})

async function assertThrowsAsync(fn, regExp) {
  let f = () => {}
  try {
    await fn()
  } catch(e) {
    f = () => {throw e}
  } finally {
    assert.throws(f, regExp)
  }
}
