const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const bcrypt = require('bcryptjs');

async function main() {

    //Seed users
    user = await prisma.user.create({
        data: {
            email: 'fabio.olcese@gmail.com',
            password: await bcrypt.hash('sonsof11', 12),
            username: 'Bembos',
        },
    })

    //Blockchains
    await prisma.blockchain.create({
        data: {
            label: 'Binance Smart Chain',
            abbrevation: 'BSC'
        },
    })

    //Buy Order statuses
    await prisma.buyOrderStatus.createMany({
        data: [
            {
                label: 'Waiting to Buy'
            },
            {
                label: 'Failed'  
            },
            {
                label: 'Completed'
            }
        ]
    })

    //Transaction statuses
    await prisma.transactionStatus.createMany({
        data: [
            {
                label: 'Bought'
            },
            {
                label: 'Completed'
            },
            {
                label: 'Timed out'
            },
            {
                label: 'Failed'
            }
        ]
    })

    //Rules types
    await prisma.constraintType.create({
        data: 
            {
                label: 'General Constraint'
            }  
    })

    await prisma.constraintType.create({
        data: 
            {
                label: 'Contract Code Constraint',
                contractCodeConstraints: {
                    create: {
                        label: 'Source Code Constraints',
                        desc: 'The user constraints regarding the source code of a token\'s contract'
                    }
                }
            }
    })
/*
    await prisma.tradeWindow.create({
        data: 
            {
                tokenAddress: 'adijsdiasjdipjaspdajdpapisodjap',
                tokenName: 'POOP',
                botId: 1
            }
    })

    await prisma.transaction.create({
        data: 
            {
                tokenGiven: 'BNB',
                givenAmount: 0.01,
                tokenReceived: 'POOP',
                receivedAmount: 1111111111111,
                transactionStatusId: 1,
                tradeWindowId: 1,
            }
    })

    await prisma.logMessage.create({
        data: 
            {
                content: 'Bought a, amount: 200302302',
                tradeWindowId: 1
            }
    })
    */
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
        .finally(async () => {
        await prisma.$disconnect()
    })