const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

//Pancake swap manager
const PancakeSwapManager = require('../crypto/pancakeSwapManager/pancakeSwapManager')

/**
 * Retrieves the user's buy orders
 * @param {User} user 
 * @returns 
 */
exports.retrieveUserWithBuyOrders = (user) => {
    return prisma.user.findUnique({
        where : {
            id: user.id
        },
        include: {
            buyOrders: {
                include : {
                    buyOrderStatus: true
                }
            }
        }
    })
}

/**
 * Creates a db entry
 * @param {Data} req 
 * @returns 
 */
exports.create = async (req) => {

    //Creates database row
    buyOrder = await prisma.buyOrder.create({
        data: {
            label: req.body.label,
            address: req.body.address,
            pairAddress: req.body.pairAddress,
            slippage: parseInt(req.body.slippage),
            amountGiven:parseFloat(req.body.amountGiven),
            userId: parseInt(req.body.userId),
            blockchainId: parseInt(req.body.blockchainId),
            buyOrderStatusId: parseInt(req.body.buyOrderStatusId)
        }
    })

    //Retrieve instance of buy order manager
    let manager = PancakeSwapManager.getBuyOrderManager();

    //Retrieve data required 
    buyOrder = await prisma.buyOrder.findUnique({
        where : {
            id: buyOrder
        },
        include: {
            buyOrders: {
                include : {
                    user: {
                        include : {
                            bot : true
                        }
                    }
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
 * Find the db entry with the correct id
 * @param {Id} buyOrderId 
 * @returns 
 */
exports.find = (buyOrderId) => {
    return prisma.buyOrder.findUnique({
        where: {
            id : parseInt(buyOrderId)
        }
    })
}

/**
 * Updates a db entry
 * @param {Id} buyOrderId 
 * @returns 
 */
exports.update = (fields) => {
    return prisma.buyOrder.update({
        where: {
            id: parseInt(fields.buyOrder),
        },
        data: {
            label: fields.label,
            address: fields.address,
            pairAddress: fields.pairAddress,
            slippage: parseInt(fields.slippage),
            amountGiven:parseFloat(fields.amountGiven),
            buyOrderStatusId: statusId
        },
    })
}

/**
 * Deletes a db entry given the id
 * @param {Id} buyOrderId 
 * @returns 
 */
exports.delete = async (buyOrderId) => {

    let buyOrder = await this.find(buyOrderId)

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
