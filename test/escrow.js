var Escrow = artifacts.require("Escrow");

contract('Escrow', function(accounts) {
  it("gets deployed", function() {
    return Escrow.deployed().then(function(instance) {
      assert.notEqual(instance, null, "Contract wasn't null");
    });
  });
})
