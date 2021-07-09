const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * All blockchains
 * @returns 
 */
exports.all = () => {
    return prisma.blockchain.findMany()
}