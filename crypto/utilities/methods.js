const { Pair, TokenAmount, Token } = require('@uniswap/sdk');
const { ethers } = require('ethers'); 

exports.contructPair = async (liquidityToken0, token0Address, decimals0, token1Address, decimals1, chainId, pairAddress, liquidityDecimals, account) => {

    const token0 = new Token(chainId, token0Address, decimals0)
    const token1 = new Token(chainId, token1Address, decimals1)

    //Get new reserves for pair
    const liquidityContract = new ethers.Contract(
        pairAddress,
        ['function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'],
        account
        );
    
    //Construct pair
    const reserves = await liquidityContract.getReserves(); 

    const tokens = [token0, token1]
    const [tokenA, tokenB] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]]
    
    return new Pair(new TokenAmount(tokenA, reserves[0]), new TokenAmount(tokenB, reserves[1]))
}