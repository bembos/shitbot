const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Find the db entry with the correct id
 * @param {Id} constraintId 
 * @returns 
 */
 exports.find = (label) => {
    return prisma.buyOrderStatus.findUnique({
        where: {
            label : label
        }
    })
}