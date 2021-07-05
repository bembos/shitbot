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
            blockchainId: parseInt(req.body.blockchainId),
            buyOrderStatusId: parseInt(req.body.buyOrderStatusId),
            maxTime: parseInt(req.body.maxTime)
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
        bot : buyOrder.user.bot
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

    //Create database row
    return prisma.buyOrder.delete({
        where: {
            id: parseInt(buyOrderId)    ,
        },
    })
}
