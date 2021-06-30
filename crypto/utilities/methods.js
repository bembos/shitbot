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

    let parsedReserves = [];
    parsedReserves[0] = ethers.utils.formatUnits(reserves[0], liquidityDecimals);
    parsedReserves[1] = ethers.utils.formatUnits(reserves[1], liquidityDecimals);

    if (liquidityToken0 != token0Address) {
        let temp = parsedReserves[0]
        parsedReserves[0] = parsedReserves[1];
        parsedReserves[1] = temp; 
    }
    
    return new Pair(new TokenAmount(token0, parsedReserves[0]), new TokenAmount(token1, parsedReserves[1]))
}