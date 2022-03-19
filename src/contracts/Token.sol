// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.11;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

library Balances {
    function move(mapping(address => uint256) storage balances, address from, address to, uint amount) internal {
        require(balances[from] >= amount);
        require(balances[to] + amount >= balances[to]);
        balances[from] -= amount;
        balances[to] += amount;
    }
}

contract Token {
    using SafeMath for uint;

    //variables
    string public name = "m00n DEX";
    string public symbol = "M00N";
    uint256 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) balances;
    using Balances for *;
    mapping(address => mapping(address => uint256)) public allowance;
    
    //events
    event Transfer(address indexed from, address to, uint amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    constructor() {
        totalSupply = 1000000 * (10 ** decimals);
        balances[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint _amount) public returns (bool sucess) {     
        require(balances[msg.sender] >= _amount);
        _transfer(msg.sender, _to, _amount);
        return true;
    }

    function _transfer(address _from, address _to, uint256 _amount) internal {
        require(_to != address(0));
        balances.move(_from, _to, _amount);
        emit Transfer(_from, _to, _amount);
    }

    function balanceOf(address tokenOwner) public view returns (uint balance) {
        return balances[tokenOwner];
    }

    function approve(address _spender, uint256 _amount) public returns (bool success) {
        require(_spender != address(0));
        allowance[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _amount) public returns (bool success) {
        require(_amount <= balanceOf(_from));
        require(_amount <= allowance[_from][msg.sender]);
        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_amount); 
        _transfer(_from, _to, _amount);
        return true;
    }
}