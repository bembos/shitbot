const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

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
exports.create = (req) => {
    return prisma.buyOrder.create({
        data: {
            label: req.body.label,
            address: req.body.address,
            slippage: parseInt(req.body.slippage),
            amountGiven:parseFloat(req.body.amountGiven),
            userId: parseInt(req.body.userId),
            blockchainId: parseInt(req.body.blockchainId),
            buyOrderStatusId: parseInt(req.body.buyOrderStatusId)
        }
    })
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
exports.update = (req) => {
    return prisma.buyOrder.update({
        where: {
            id: parseInt(req.body.buyOrder),
        },
        data: {
            label: req.body.label,
            address: req.body.address,
            slippage: parseInt(req.body.slippage),
            amountGiven:parseFloat(req.body.amountGiven),
        },
    })
}

/**
 * Deletes a db entry given the id
 * @param {Id} buyOrderId 
 * @returns 
 */
exports.delete = (buyOrderId) => {
    return prisma.buyOrder.delete({
        where: {
            id: parseInt(buyOrderId)    ,
        },
    })
}
