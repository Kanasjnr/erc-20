// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract DLToken{

    //the state variables
    string tokenName;
    string tokenSymbol;
    uint256 totalSupply;
    address owner;

     //making an amount tracable by address
    mapping (address => uint256) balances;

     //making an amount tracable by address A  and address A traced by address B
    //key => (key => value)
    mapping (address => mapping (address => uint256)) allow;

    constructor(string memory _name, string memory _symbol){
        tokenName = _name;
        tokenSymbol = _symbol;
        owner = msg.sender;
        // Mint initial supply
        mint(1_000_000, owner);
    }

    // Events for logging
    event Transfer(address indexed sender, address indexed reciever, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);


    function getTokenName() external view returns (string memory){
        return tokenName;
    }

    function getSymbol() external view returns (string memory){
        return tokenSymbol;
    }

    function getTotalSupply() external view returns (uint256){
        return totalSupply;
    }

    function decimal() external pure returns(uint8){
        return 18;
    }

    // Balance check
    function balanceOf(address _address) external view returns (uint256){
        return balances[_address];
    }

    
    function transfer(address _reciever, uint256 _amountOfToken) external {
        require(_reciever != address(0), "Address is not allowed");
        require(_amountOfToken <= balances[msg.sender], "You can't take more than what is available");

        uint256 burnAmount = (_amountOfToken * 5) / 100;  
        uint256 transferAmount = _amountOfToken - burnAmount;  

        balances[msg.sender] -= _amountOfToken;

        
        balances[_reciever] += transferAmount;

        burn(msg.sender, burnAmount);

        emit Transfer(msg.sender, _reciever, transferAmount);
    }

    function approve(address _delegate, uint256 _amountOfToken) external {
        require(balances[msg.sender] > _amountOfToken, "Balance is not enough");

        allow[msg.sender][_delegate] = _amountOfToken;

        emit Approval(msg.sender, _delegate, _amountOfToken);
    }

    function allowance(address _owner, address _delegate) external view returns (uint) {
        return allow[_owner][_delegate];
    }

    function transferFrom(address _owner, address _buyer, uint256 _amountOfToken) external {
        require(_owner != address(0), "Address is not allowed");
        require(_buyer != address(0), "Address is not allowed");

        require(_amountOfToken <= balances[_owner], "Insufficient balance");
        require(_amountOfToken <= allow[_owner][msg.sender], "Allowance exceeded");

        uint256 burntAmount = (_amountOfToken * 5) / 100;  
        uint256 transferAmount = _amountOfToken - burntAmount;  

        balances[_owner] -= _amountOfToken;

        allow[_owner][msg.sender] -= _amountOfToken;

        balances[_buyer] += transferAmount;

        burn(_owner, burntAmount);

        emit Transfer(_owner, _buyer, transferAmount);
    }

    function burn(address _address, uint256 _amount) internal {
        balances[_address] -= _amount;
        totalSupply -= _amount;

        emit Transfer(_address, address(0), _amount);
    }

    // Mint tokens (called in the constructor)
    function mint(uint256 _amount, address _addr) internal {
        uint256 actualSupply = _amount * (10**18);
        balances[_addr] += actualSupply;
        totalSupply += actualSupply;

        emit Transfer(address(0), _addr, actualSupply);
    }
}
