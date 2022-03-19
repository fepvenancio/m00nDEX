import { tokens, EVM_REVERT, ETHER_ADDRESS } from './helpers'

const Token = artifacts.require('./Token')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Token', ([deployer, receiver, exchange]) => {
  const name = 'm00n DEX'
  const symbol = 'M00N'
  const decimals = '18'
  const totalSupply = tokens(1000000).toString()
  let token

  beforeEach(async () => {
    token = await Token.new()
  })

  describe('deployment', () => {
    it('tracks the name', async () => {
      const result = await token.name()
      result.should.equal(name)
    })

    it('tracks the symbol', async ()  => {
      const result = await token.symbol()
      result.should.equal(symbol)
    })

    it('tracks the decimals', async ()  => {
      const result = await token.decimals()
      result.toString().should.equal(decimals)
    })

    it('tracks the total supply', async ()  => {
      const result = await token.totalSupply()
      result.toString().should.equal(totalSupply)
    })

    it('assigns the total supply to the deployer', async ()  => {
      const result = await token.balanceOf(deployer)
      result.toString().should.equal(totalSupply)
    })
  })

  describe('sending tokens', () => {
    let result
    let quantity

    describe('success', async () => {
      beforeEach(async () => {
        quantity = tokens(100)
        result = await token.transfer(receiver, quantity, { from: deployer })
      })

      it('transfers token balances', async () => {
        let balanceOf
        balanceOf = await token.balanceOf(deployer)
        balanceOf.toString().should.equal(tokens(999900).toString())
        balanceOf = await token.balanceOf(receiver)
        balanceOf.toString().should.equal(tokens(100).toString())
      })

      it('emits a Transfer event', async () => {
        const log = result.logs[0]
        log.event.should.eq('Transfer')
        const event = log.args
        event.from.toString().should.equal(deployer, 'from is correct')
        event.to.should.equal(receiver, 'to is correct')
        event.amount.toString().should.equal(quantity.toString(), 'amount is correct')
      })

    })

    describe('failure', async () => {

      it('rejects insufficient balances', async () => {
        let invalidQuantity
        invalidQuantity = tokens(100000000) // 100 million - greater than total supply
        await token.transfer(receiver, invalidQuantity, { from: deployer }).should.be.rejectedWith(EVM_REVERT)

        // Attempt transfer tokens, when you have none
        invalidQuantity = tokens(10) // recipient has no tokens
        await token.transfer(deployer, invalidQuantity, { from: receiver }).should.be.rejectedWith(EVM_REVERT)
      })

      it('rejects invalid recipients', async () => {
        await token.transfer(0x0, quantity, { from: deployer }).should.be.rejected
      })

    })
  })

  describe('approving tokens', () => {
    let result
    let quantity

    beforeEach(async () => {
      quantity = tokens(100)
      result = await token.approve(exchange, quantity, { from: deployer })
    })

    describe('success', () => {
      it('allocates an allowance for delegated token spending on exchange', async () => {
        const allowance = await token.allowance(deployer, exchange)
        allowance.toString().should.equal(quantity.toString())
      })


      it('emits an Approval event', async () => {
        const log = result.logs[0]
        log.event.should.eq('Approval')
        const event = log.args
        event.owner.toString().should.equal(deployer, 'owner is correct')
        event.spender.should.equal(exchange, 'spender is correct')
        event.amount.toString().should.equal(quantity.toString(), 'amount is correct')
      })

    })

    describe('failure', () => {
      it('rejects invalid spenders', async () => {
        await token.approve(ETHER_ADDRESS, quantity, { from: deployer }).should.be.rejected
      })
    })
  })

  describe('delegated token transfers', () => {
    let result
    let quantity

    beforeEach(async () => {
      quantity = tokens(100)
      await token.approve(exchange, quantity, { from: deployer })
    })

    describe('success', async () => {
      beforeEach(async () => {
        result = await token.transferFrom(deployer, receiver, quantity, { from: exchange })
      })

      it('transfers token balances', async () => {
        let balanceOf
        balanceOf = await token.balanceOf(deployer)
        balanceOf.toString().should.equal(tokens(999900).toString())
        balanceOf = await token.balanceOf(receiver)
        balanceOf.toString().should.equal(tokens(100).toString())
      })

      it('resets the allowance', async () => {
        const allowance = await token.allowance(deployer, exchange)
        allowance.toString().should.equal('0')
      })

      it('emits a Transfer event', async () => {
        const log = result.logs[0]
        log.event.should.eq('Transfer')
        const event = log.args
        event.from.toString().should.equal(deployer, 'from is correct')
        event.to.should.equal(receiver, 'to is correct')
        event.amount.toString().should.equal(quantity.toString(), 'amount is correct')
      })

    })

    describe('failure', async () => {
      it('rejects insufficient quantitys', async () => {
        // Attempt transfer too many tokens
        const invalidQuantity = tokens(100000000)
        await token.transferFrom(deployer, receiver, invalidQuantity, { from: exchange }).should.be.rejectedWith(EVM_REVERT)
      })

      it('rejects invalid recipients', async () => {
        await token.transferFrom(deployer, ETHER_ADDRESS, quantity, { from: exchange }).should.be.rejected
      })
    })
  })

})
