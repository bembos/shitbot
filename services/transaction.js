const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * 
 * @param {fields to create transaction with} fields 
 * @returns 
 */
exports.create = (fields) => {
    return prisma.transaction.create({
        data : {
            tokenGiven : fields.tokenGiven,
            givenAmount : fields.givenAmount,
            tokenReceived : fields.tokenReceived,
            receivedAmount : fields.receivedAmount,
            transactionStatusId : fields.transactionStatusId,
            tradeWindowId : fields.tradeWindowId
        }
    })
}
