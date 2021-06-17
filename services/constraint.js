const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Creates a bot for a user
 * @param {User} user 
 */
exports.createGeneralContraintsForUser = (user) => {
    return prisma.generalConstraints.create({
        data : {
            marketCap : false,
            maxCap : 0,
            minCap : 0,
            liquidity: false,
            maxLiq : 0,
            minLiq: 0,
            ownerRenounced: false,
            userId: user.id,
            constraintTypeId: 1
        }
    })
}

/**
 * Updates General constraint table entry
 * @param {Request params} req 
 * @param {Id of bot to update} constraintId 
 * @returns 
 */
exports.updateGeneralConstraints = (req, constraintId) => {
    return prisma.generalConstraints.update({
        where : {
            id: parseInt(constraintId)
        },
        data : {
            marketCap : req.body.marketCap ? true : false,
            maxCap : parseInt(req.body.maxCap),
            minCap : parseInt(req.body.minCap),
            liquidity: req.body.liquidity ? true : false,
            maxLiq : parseInt(req.body.maxLiq),
            minLiq: parseInt(req.body.minLiq),
            ownerRenounced: req.body.ownerRenounced ? true : false,
        }
    })
}

/**
 * Retrieves the user's bot
 * @param {User} user 
 * @returns 
 */
exports.retrieveUserWithGeneralConstraints = (user) => {
    return prisma.user.findUnique({
        where : {
            id: user.id
        },
        include: {
            generalConstraints: true
        }
    })
}