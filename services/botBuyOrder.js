const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

//Pancake swap manager
const PancakeSwapManager = require('../crypto/pancakeSwapManager/pancakeSwapManager')

/**
 * Creates a db entry
 * @param {Data} req 
 * @returns 
 */
exports.start = async (req) => {
    //Get created status
    status = await prisma.buyOrderStatus.findUnique({
        where: {
            label : "Waiting to Buy"
        }
    })

    //Get blockchain id (temporary)
    blockchain = await prisma.blockchain.findUnique({
        where: {
            id: parseInt(req.body.blockchainId)
        }
    })
    console.log(blockchain.label);

    //Creates database row
    buyOrder = await prisma.buyOrder.create({
        data: {
            label: req.body.label,
            address: req.body.address,
            pairAddress: req.body.pairAddress,
            slippage: parseInt(req.body.slippage),
            amountGiven:parseFloat(req.body.amountGiven),
            autoMultiplier : parseFloat(req.body.autoMultiplier),
            userId: parseInt(req.body.userId),
            blockchainId: parseInt(blockchain.id),
            buyOrderStatusId: parseInt(status.id),
            maxTime: parseInt(req.body.maxTime),
            timeBeforeBuy: parseInt(req.body.timeBeforeBuy),
            gasfees : parseInt(req.body.gasfees)
        }
    })

    //Retrieve instance of buy order manager
    let manager = PancakeSwapManager.getBuyOrderManager();

    //Retrieve data required 
    buyOrder = await prisma.buyOrder.findUnique({
        where : {
            id: buyOrder.id
        },
        include : {
            user: {
                include : {
                    bot : true
                }
            }
        }
    })

    //Start a new bot instance with the data
    manager.start({ 
        buyOrder : buyOrder,
        user : buyOrder.user,
        bot : buyOrder.user.bot,
        blockchainData : blockchain
    });

    return buyOrder;
}


/**
 * Deletes a db entry given the id
 * @param {Id} buyOrderId 
 * @returns 
 */
exports.stop = async (buyOrderId) => {

    let buyOrder = await prisma.buyOrder.findUnique({
                        where: {
                                id : parseInt(buyOrderId)
                            }
                        })

    //If the status given is 1
    if (buyOrder.buyOrderStatusId == 1) {
        
        //Stop the buy order
        let manager = PancakeSwapManager.getBuyOrderManager();
        manager.stop({ buyOrder : buyOrder});
    }

    //Delete logs
    await prisma.buyOrderLogMessage.deleteMany({
        where: {
            buyOrderId : parseInt(buyOrderId)
        }
    })

    //Create database row
    return prisma.buyOrder.delete({
        where: {
            id: parseInt(buyOrderId)    ,
        },
    })
}
